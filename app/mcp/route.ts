import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { runWithActor, type Actor } from "@/lib/actor";
import { issuerFromRequest } from "@/lib/oauth";
import { verifyMcpAccessToken } from "@/lib/oauth-grant";
import {
  addNoteInput,
  JOURNAL_INSTRUCTIONS,
  listBoardInput,
  markDoneInput,
  publishItemInput,
  todayUpcomingInput,
  toolAddNote,
  toolListBoard,
  toolMarkDone,
  toolPublishItem,
  toolTodayUpcoming,
  toolUpdateItem,
  updateItemInput,
  asToolError,
} from "@/lib/mcp-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "MCP-Protocol-Version, MCP-Session-Id",
};

const mcp = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_board",
      {
        title: "List journal board",
        description:
          "List Ford's living ops journal grouped by in progress (in_flight), left to do (next), and done. Call this when you start a session so you know what is already in motion. Then report work you started, finished, or that Ford needs to do next.",
        inputSchema: listBoardInput,
      },
      async (args) => {
        try {
          return await toolListBoard(args);
        } catch (error) {
          return asToolError(error);
        }
      },
    );

    server.registerTool(
      "get_today_upcoming",
      {
        title: "Today and coming days",
        description:
          "Get today's desk and the coming days. Today includes dated items plus in-progress work that is due or has no future date. Use this to decide what Ford should do today versus later.",
        inputSchema: todayUpcomingInput,
      },
      async (args) => {
        try {
          return await toolTodayUpcoming(args);
        } catch (error) {
          return asToolError(error);
        }
      },
    );

    server.registerTool(
      "publish_item",
      {
        title: "Publish journal item",
        description:
          "Create a journal item (or replace one if you pass id). Use in_flight / in_progress when you start work, done when you finish, and next when Ford needs to do something. Set for_date or due_date as YYYY-MM-DD when you know the day.",
        inputSchema: publishItemInput,
      },
      async (args) => {
        try {
          return await toolPublishItem(args);
        } catch (error) {
          return asToolError(error);
        }
      },
    );

    server.registerTool(
      "update_item",
      {
        title: "Update journal item",
        description:
          "Update an existing journal item by id. Change status, title, notes, or due date. Use this instead of creating a duplicate when the work is already on the board.",
        inputSchema: updateItemInput,
      },
      async (args) => {
        try {
          return await toolUpdateItem(args);
        } catch (error) {
          return asToolError(error);
        }
      },
    );

    server.registerTool(
      "mark_done",
      {
        title: "Mark item done",
        description:
          "Mark a journal item done. Optionally add a closing note about what landed. Call this when you finish work.",
        inputSchema: markDoneInput,
      },
      async (args) => {
        try {
          return await toolMarkDone(args);
        } catch (error) {
          return asToolError(error);
        }
      },
    );

    server.registerTool(
      "add_note",
      {
        title: "Add a note",
        description:
          "Append a dated note to an existing item without changing its status. Use this for progress, blockers, or something Ford should know.",
        inputSchema: addNoteInput,
      },
      async (args) => {
        try {
          return await toolAddNote(args);
        } catch (error) {
          return asToolError(error);
        }
      },
    );
  },
  {
    serverInfo: {
      name: "sven-journal",
      version: "1.0.0",
    },
    instructions: JOURNAL_INSTRUCTIONS,
  },
);

function actorFromClaims(name: string, platform: string): Actor {
  return { kind: "agent", name, platform };
}

const authorized = withMcpAuth(
  async (req) => {
    const extra = req.auth?.extra as Actor | undefined;
    const actor: Actor = extra ?? {
      kind: "agent",
      name: "agent",
      platform: "mcp",
    };
    return runWithActor(actor, () => mcp(req));
  },
  async (req, bearerToken) => {
    if (!bearerToken) return undefined;
    const issuer = issuerFromRequest(req);
    const claims = await verifyMcpAccessToken(bearerToken, issuer);
    if (!claims) return undefined;
    return {
      token: bearerToken,
      clientId: claims.client_id,
      scopes: claims.scope.split(/[ +]/),
      expiresAt: claims.exp,
      extra: actorFromClaims(claims.client_name, "mcp"),
    };
  },
  {
    required: true,
    resourceMetadataPath: "/.well-known/oauth-protected-resource",
  },
);

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handle(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return withCors(await authorized(request));
}

export { handle as GET, handle as POST, handle as DELETE, handle as OPTIONS };
