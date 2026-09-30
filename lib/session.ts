import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "qova_s";
export const SESSION_DAYS = 30;

type Payload = { w: string; iat: number; exp: number };

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("auth_not_configured");
  return s;
}
const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const mac = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function signSession(wallet: string): string {
  const now = Math.floor(Date.now() / 1000);
  const body = b64(JSON.stringify({ w: wallet, iat: now, exp: now + SESSION_DAYS * 86400 } satisfies Payload));
  return `${body}.${mac(body)}`;
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const a = Buffer.from(sig), b = Buffer.from(mac(body));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    return p.exp > Date.now() / 1000 ? p.w : null;
  } catch {
    return null;
  }
}

/** The signed in wallet for this request, or null. */
export async function currentWallet(): Promise<string | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 86400,
};

/** State changing requests must come from our own pages. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === new URL(req.url).host || new URL(origin).host === req.headers.get("host"); } catch { return false; }
}
