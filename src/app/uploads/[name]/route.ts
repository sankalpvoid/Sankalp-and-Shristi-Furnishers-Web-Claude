import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/db";

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-f0-9]{16}\.webp$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const buf = fs.readFileSync(path.join(DATA_DIR, "uploads", name));
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch { return new Response("Not found", { status: 404 }); }
}
