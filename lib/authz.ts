export const DEFAULT_ALLOWED_EMAIL = "fordheacock@gmail.com";

export function allowedEmail(): string {
  return (process.env.AUTH_ALLOWED_EMAIL ?? DEFAULT_ALLOWED_EMAIL)
    .trim()
    .toLowerCase();
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === allowedEmail();
}

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/sign-in" ||
    pathname === "/denied" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/mcp" ||
    pathname.startsWith("/mcp/") ||
    pathname.startsWith("/.well-known/") ||
    pathname === "/oauth/register" ||
    pathname === "/oauth/token" ||
    pathname === "/oauth/revoke"
  );
}

/** Only same-origin relative paths. Blocks protocol-relative and external URLs. */
export function safeCallbackUrl(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.includes("://") || raw.includes("\\")) {
    return "/";
  }
  return raw;
}
