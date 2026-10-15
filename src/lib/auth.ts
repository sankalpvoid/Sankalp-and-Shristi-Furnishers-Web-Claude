import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./constants";

const SESSION_SECONDS = 60 * 60 * 8; // 8 hours; there is no server-side revocation (see SECURITY.md)

function secret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
}
export function adminConfigured(): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw === "change-me-before-use" || !secret()) return false;
  // In production a short password is refused outright.
  if (process.env.NODE_ENV === "production" && pw.length < 12) return false;
  return true;
}
const sign = (payload: string, key: string) => crypto.createHmac("sha256", key).update(payload).digest("base64url");

function safeEq(a: string, b: string) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkCredentials(user: string, pass: string): boolean {
  if (!adminConfigured()) return false;
  const u = process.env.ADMIN_USERNAME || "owner";
  // Evaluate both so timing doesn't reveal which was wrong.
  const a = safeEq(user, u), b = safeEq(pass, process.env.ADMIN_PASSWORD as string);
  return a && b;
}

export async function createSession(user: string) {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET not configured");
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ u: user, exp })).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload, key)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_SECONDS,
  });
}
export async function destroySession() { (await cookies()).delete(SESSION_COOKIE); }

export async function currentAdmin(): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEq(sig, sign(payload, key))) return null;
  try {
    const { u, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return exp > Date.now() / 1000 ? String(u) : null;
  } catch { return null; }
}

/** Call at the top of EVERY admin page, server action and admin API route. */
export async function requireAdmin(): Promise<string> {
  const u = await currentAdmin();
  if (!u) redirect("/admin/login");
  return u;
}
export async function isAdmin() { return !!(await currentAdmin()); }
