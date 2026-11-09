import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "fb_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Still do a compare so timing does not leak the length mismatch early.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/** Token format: `owner.<expiresEpochSeconds>.<hmac>` */
export function createSessionToken(secret: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + SESSION_MAX_AGE;
  const payload = `owner.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): boolean {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "owner") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp * 1000 < now) return false;
  return safeEqual(parts[2], sign(`${parts[0]}.${parts[1]}`, secret));
}
