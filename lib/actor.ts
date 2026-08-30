import { AsyncLocalStorage } from "node:async_hooks";

export type Actor = {
  kind: "human" | "agent";
  name: string;
  platform: string;
};

export const FORD_ACTOR: Actor = {
  kind: "human",
  name: "Ford",
  platform: "web",
};

const actorStorage = new AsyncLocalStorage<Actor>();

export function runWithActor<T>(actor: Actor, fn: () => T): T {
  return actorStorage.run(actor, fn);
}

export function getActor(): Actor {
  return actorStorage.getStore() ?? FORD_ACTOR;
}

export function actorLabel(actor: Actor = getActor()): string {
  return actor.kind === "agent"
    ? `${actor.name} (${actor.platform})`
    : actor.name;
}
