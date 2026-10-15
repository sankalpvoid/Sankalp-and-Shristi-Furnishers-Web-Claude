import { NextResponse } from "next/server";
import { db } from "@/db";
import { enquirySchema } from "@/lib/enquiry-schema";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getConfiguration } from "@/lib/repo";

export async function POST(req: Request) {
  if (!rateLimit(`enq:${clientIp(req.headers)}`, 8, 600)) {
    return NextResponse.json({ ok: false, error: "Too many submissions. Please wait a few minutes and try again, or call the showroom." }, { status: 429 });
  }
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }); }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] = i.message;
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields.", fields }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true, id: 0 }); // bot: pretend success, store nothing
  if (d.contactMethod === "email" && !d.email) return NextResponse.json({ ok: false, error: "Please add an email address, or choose another contact method.", fields: { email: "Required if you prefer email" } }, { status: 400 });
  if (d.type === "visit" && !d.preferredDate) return NextResponse.json({ ok: false, error: "Please choose a preferred visit date.", fields: { preferredDate: "Choose a date" } }, { status: 400 });

  const conn = db();
  // Never trust client-supplied names: resolve product from the database.
  let productName = "";
  let productId: number | null = null;
  if (d.productId) {
    const p = conn.prepare("SELECT id, name FROM products WHERE id=? AND status='published'").get(d.productId) as { id: number; name: string } | undefined;
    if (p) { productId = p.id; productName = p.name; }
  }
  let configRef = "";
  if (d.configRef) {
    const c = getConfiguration(d.configRef);
    if (!c) return NextResponse.json({ ok: false, error: "That configuration reference was not found. Check it or remove it from the form.", fields: { configRef: "Reference not found" } }, { status: 400 });
    configRef = c.ref;
    if (!productId && c.product_id) {
      const p = conn.prepare("SELECT id, name FROM products WHERE id=?").get(c.product_id) as { id: number; name: string } | undefined;
      if (p) { productId = p.id; productName = p.name; }
    }
  }
  const info = conn.prepare(`INSERT INTO enquiries
    (type,intent,name,phone,email,contact_method,product_id,product_name,config_ref,message,preferred_date,categories,shortlist)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    d.type, d.intent, d.name, d.phone, d.email || "", d.contactMethod, productId, productName, configRef,
    d.message || "", d.preferredDate || "", JSON.stringify(d.categories), JSON.stringify(d.shortlist),
  );
  return NextResponse.json({ ok: true, id: Number(info.lastInsertRowid) });
}
