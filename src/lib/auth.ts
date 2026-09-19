// Signed, expiring session cookie. Uses Web Crypto (available in both the Node
// and Edge runtimes) so it works unmodified in middleware.
//
// The payload is base64url-encoded JSON, which keeps it free of the "." used
// to separate payload from signature, and carries the username so the app
// knows who is signed in without a second lookup on every request.

export const SESSION_COOKIE_NAME = "zea_dash_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface SessionPayload {
  username: string;
  expiresAt: number; // unix seconds
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to your environment variables."
    );
  }
  return secret;
}

async function hmac(payload: string, secret: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", keyMaterial, new TextEncoder().encode(payload));
  return bufferToBase64Url(signatureBuffer);
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encodePayload(value: SessionPayload): string {
  const json = JSON.stringify(value);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodePayload(encoded: string): SessionPayload | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const parsed = JSON.parse(decodeURIComponent(escape(atob(padded)))) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const { username, expiresAt } = parsed as Record<string, unknown>;
    if (typeof username !== "string" || typeof expiresAt !== "number") return null;
    return { username, expiresAt };
  } catch {
    return null;
  }
}

export async function createSessionToken(username: string): Promise<{ token: string; maxAge: number }> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = encodePayload({ username, expiresAt });
  const signature = await hmac(payload, getSecret());
  return { token: `${payload}.${signature}`, maxAge: SESSION_TTL_SECONDS };
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!payload || !signature) return null;

  const expected = await hmac(payload, getSecret());
  if (expected.length !== signature.length) return null;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  const decoded = decodePayload(payload);
  if (!decoded) return null;
  if (!(decoded.expiresAt * 1000 > Date.now())) return null;
  return decoded;
}
