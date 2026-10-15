import { db } from "@/db";

/** Simple DB-backed sliding-window limiter (works across processes). */
export function rateLimit(bucket: string, max: number, windowSec: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const conn = db();
  conn.prepare("DELETE FROM rate_limits WHERE ts < ?").run(now - 3600);
  const { n } = conn.prepare("SELECT COUNT(*) n FROM rate_limits WHERE bucket=? AND ts>=?").get(bucket, now - windowSec) as { n: number };
  if (n >= max) return false;
  conn.prepare("INSERT INTO rate_limits (bucket, ts) VALUES (?,?)").run(bucket, now);
  return true;
}
export function clientIp(h: Headers): string {
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}
