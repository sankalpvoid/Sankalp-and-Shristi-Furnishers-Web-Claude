import { db } from "@/db";

/** Liveness + database check for hosting health probes. Reveals no data. */
export async function GET() {
  try {
    db().prepare("SELECT 1").get();
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
