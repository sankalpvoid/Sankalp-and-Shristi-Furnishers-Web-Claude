"use server";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { z } from "zod";
import { db } from "@/db";
import { checkCredentials, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getSettings, saveSettings } from "@/lib/settings";
import { importInventory } from "@/lib/import";
import { removeUpload, saveUpload } from "@/lib/uploads";
import { slugify } from "@/lib/util";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/site-defaults";

export type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const n = (f: FormData, k: string) => { const v = s(f, k); return v === "" ? null : Number(v); };
const list = (v: string) => JSON.stringify(v.split(/[\n,;]/).map((x) => x.trim()).filter(Boolean));

// ---------------- auth ----------------
export async function login(_: ActionState, f: FormData): Promise<ActionState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, 8, 900)) return { error: "Too many attempts. Try again in a few minutes." };
  if (!checkCredentials(s(f, "username"), String(f.get("password") ?? ""))) return { error: "Incorrect username or password." };
  await createSession(s(f, "username"));
  redirect("/admin");
}
export async function logout() { await destroySession(); redirect("/admin/login"); }

// ---------------- enquiries ----------------
const STATUSES = ["new", "contacted", "quotation_sent", "negotiating", "converted", "lost"];
export async function updateEnquiry(f: FormData) {
  await requireAdmin();
  const id = Number(f.get("id"));
  const status = s(f, "status");
  if (!id || !STATUSES.includes(status)) return;
  db().prepare("UPDATE enquiries SET status=?, assigned_to=?, follow_up_date=?, updated_at=datetime('now') WHERE id=?")
    .run(status, s(f, "assigned_to").slice(0, 80), /^\d{4}-\d{2}-\d{2}$/.test(s(f, "follow_up_date")) ? s(f, "follow_up_date") : "", id);
  revalidatePath(`/admin/enquiries/${id}`); revalidatePath("/admin/enquiries"); revalidatePath("/admin");
}
export async function setEnquiryStatus(f: FormData) {
  await requireAdmin();
  const id = Number(f.get("id")), status = s(f, "status");
  if (!id || !STATUSES.includes(status)) return;
  db().prepare("UPDATE enquiries SET status=?, updated_at=datetime('now') WHERE id=?").run(status, id);
  revalidatePath(`/admin/enquiries/${id}`); revalidatePath("/admin/enquiries"); revalidatePath("/admin");
}
export async function addNote(f: FormData) {
  const who = await requireAdmin();
  const id = Number(f.get("id")), body = s(f, "body").slice(0, 2000);
  if (!id || !body) return;
  db().prepare("INSERT INTO enquiry_notes (enquiry_id, author, body) VALUES (?,?,?)").run(id, who, body);
  db().prepare("UPDATE enquiries SET updated_at=datetime('now') WHERE id=?").run(id);
  revalidatePath(`/admin/enquiries/${id}`);
}
export async function deleteEnquiry(f: FormData) {
  await requireAdmin();
  db().prepare("DELETE FROM enquiries WHERE id=?").run(Number(f.get("id")));
  redirect("/admin/enquiries");
}

// ---------------- products ----------------
const productSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  status: z.enum(["draft", "needs_review", "published", "unpublished", "archived"]),
  source: z.enum(["tally_import", "manual", "proposed_seed", "other_verified"]),
  verification: z.enum(["verified", "needs_review", "unverified"]),
  sales_method: z.enum(["fixed_price", "quote", "custom_config", "online_future"]),
  availability: z.enum(["in_stock", "made_to_order", "enquire", "out_of_stock"]),
  price_visibility: z.enum(["hidden", "show"]),
  configurator: z.enum(["", "bed", "sofa", "sofa_bed", "dining"]),
});

export async function saveProduct(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const conn = db();
  const id = Number(f.get("id")) || 0;
  const parsed = productSchema.safeParse(Object.fromEntries(["name", "status", "source", "verification", "sales_method", "availability", "price_visibility", "configurator"].map((k) => [k, s(f, k)])));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const price = n(f, "price_inr");
  if (price !== null && (!Number.isFinite(price) || price < 0)) return { error: "Price must be a positive number." };
  if (d.price_visibility === "show" && (!price || d.sales_method !== "fixed_price")) return { error: "To show a price publicly, set the sales method to “Fixed price” and enter the price." };
  if (d.status === "published" && d.configurator === "" && d.sales_method === "custom_config") return { error: "Custom configuration needs a configurator. Choose one, or change the sales method." };
  let slug = slugify(s(f, "slug") || d.name);
  const clash = conn.prepare("SELECT id FROM products WHERE slug=? AND id<>?").get(slug, id);
  if (clash) slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
  const catId = n(f, "category_id");
  let art = {};
  try { art = JSON.parse(s(f, "art") || "{}"); } catch { return { error: "Illustration settings must be valid JSON." }; }
  const row = {
    slug, sku: s(f, "sku"), name: d.name, category_id: catId, subcategory: s(f, "subcategory"),
    short_description: s(f, "short_description"), description: s(f, "description"), material: s(f, "material"), finish: s(f, "finish"), dimensions: s(f, "dimensions"),
    sizes: list(s(f, "sizes")), colours: list(s(f, "colours")), upholstery: list(s(f, "upholstery")), config_notes: s(f, "config_notes"),
    availability: d.availability, quantity: n(f, "quantity"), price_inr: price, price_visibility: d.price_visibility, sales_method: d.sales_method,
    online_purchase_approved: f.get("online_purchase_approved") ? 1 : 0, customisable: d.configurator ? 1 : f.get("customisable") ? 1 : 0, configurator: d.configurator,
    warranty_text: s(f, "warranty_text"), model_url: s(f, "model_url"), art: JSON.stringify(art),
    status: d.status, featured: f.get("featured") ? 1 : 0, source: d.source, verification: d.verification, internal_notes: s(f, "internal_notes"),
  };
  const cols = Object.keys(row);
  let pid = id;
  if (id) {
    conn.prepare(`UPDATE products SET ${cols.map((c) => `${c}=@${c}`).join(",")}, updated_at=datetime('now') WHERE id=@id`).run({ ...row, id });
  } else {
    pid = Number(conn.prepare(`INSERT INTO products (${cols.join(",")}) VALUES (${cols.map((c) => `@${c}`).join(",")})`).run(row).lastInsertRowid);
  }
  // per-product option limits
  conn.prepare("DELETE FROM product_option_limits WHERE product_id=?").run(pid);
  for (const key of new Set([...f.keys()].filter((k) => k.startsWith("limit__")))) {
    const vals = f.getAll(key).map(String);
    if (vals.length) conn.prepare("INSERT INTO product_option_limits (product_id, group_key, value_keys) VALUES (?,?,?)").run(pid, key.slice(7), JSON.stringify(vals));
  }
  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/products/${pid}?created=1`);
  return { ok: true, message: "Saved." };
}

export async function setProductStatus(f: FormData) {
  await requireAdmin();
  const st = s(f, "status");
  if (!["draft", "needs_review", "published", "unpublished", "archived"].includes(st)) return;
  db().prepare("UPDATE products SET status=?, updated_at=datetime('now') WHERE id=?").run(st, Number(f.get("id")));
  revalidatePath("/", "layout");
}
export async function deleteProduct(f: FormData) {
  await requireAdmin();
  const id = Number(f.get("id"));
  const imgs = db().prepare("SELECT url FROM product_images WHERE product_id=?").all(id) as { url: string }[];
  imgs.forEach((i) => removeUpload(i.url));
  db().prepare("DELETE FROM products WHERE id=?").run(id);
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

// ---------------- images ----------------
export async function uploadProductImage(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const pid = Number(f.get("product_id"));
  try {
    const url = await saveUpload(f.get("file") as File);
    const max = (db().prepare("SELECT COALESCE(MAX(sort_order),0) m FROM product_images WHERE product_id=?").get(pid) as { m: number }).m;
    db().prepare("INSERT INTO product_images (product_id,url,alt,sort_order) VALUES (?,?,?,?)").run(pid, url, s(f, "alt"), max + 1);
    revalidatePath("/", "layout");
    return { ok: true, message: "Image added." };
  } catch (e) { return { error: (e as Error).message }; }
}
export async function deleteProductImage(f: FormData) {
  await requireAdmin();
  const id = Number(f.get("id"));
  const r = db().prepare("SELECT url FROM product_images WHERE id=?").get(id) as { url: string } | undefined;
  if (r) { removeUpload(r.url); db().prepare("DELETE FROM product_images WHERE id=?").run(id); }
  revalidatePath("/", "layout");
}
export async function makeMainImage(f: FormData) {
  await requireAdmin();
  const id = Number(f.get("id")), pid = Number(f.get("product_id"));
  const min = (db().prepare("SELECT COALESCE(MIN(sort_order),0) m FROM product_images WHERE product_id=?").get(pid) as { m: number }).m;
  db().prepare("UPDATE product_images SET sort_order=? WHERE id=?").run(min - 1, id);
  revalidatePath("/", "layout");
}
export async function uploadAsset(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  try { return { ok: true, message: await saveUpload(f.get("file") as File) }; } catch (e) { return { error: (e as Error).message }; }
}

// ---------------- categories ----------------
export async function saveCategory(f: FormData) {
  await requireAdmin();
  const id = Number(f.get("id")) || 0;
  const name = s(f, "name"); if (!name) return;
  const slug = slugify(s(f, "slug") || name);
  const vals = { name, slug, group_name: s(f, "group_name") || "Other", description: s(f, "description"), art_kind: s(f, "art_kind") || "sofa", image_url: s(f, "image_url"), sort_order: Number(f.get("sort_order")) || 0, visible: f.get("visible") ? 1 : 0 };
  const conn = db();
  if (id) conn.prepare("UPDATE categories SET name=@name,slug=@slug,group_name=@group_name,description=@description,art_kind=@art_kind,image_url=@image_url,sort_order=@sort_order,visible=@visible WHERE id=@id").run({ ...vals, id });
  else { try { conn.prepare("INSERT INTO categories (name,slug,group_name,description,art_kind,image_url,sort_order,visible,origin) VALUES (@name,@slug,@group_name,@description,@art_kind,@image_url,@sort_order,@visible,'owner')").run(vals); } catch { /* duplicate slug ignored */ } }
  revalidatePath("/", "layout"); revalidatePath("/admin/categories");
}
export async function deleteCategory(f: FormData) {
  await requireAdmin();
  db().prepare("DELETE FROM categories WHERE id=?").run(Number(f.get("id")));
  revalidatePath("/", "layout"); revalidatePath("/admin/categories");
}

// ---------------- options ----------------
export async function saveOptionValue(f: FormData) {
  await requireAdmin();
  const id = Number(f.get("id"));
  db().prepare("UPDATE option_values SET label=?, detail=?, swatch=?, enabled=?, verified=?, sort_order=? WHERE id=?")
    .run(s(f, "label"), s(f, "detail"), s(f, "swatch"), f.get("enabled") ? 1 : 0, f.get("verified") ? 1 : 0, Number(f.get("sort_order")) || 0, id);
  revalidatePath("/admin/options"); revalidatePath("/design", "layout");
}
export async function addOptionValue(f: FormData) {
  await requireAdmin();
  const gid = Number(f.get("group_id")), label = s(f, "label");
  if (!gid || !label) return;
  const key = slugify(label).replace(/-/g, "_");
  const max = (db().prepare("SELECT COALESCE(MAX(sort_order),0) m FROM option_values WHERE group_id=?").get(gid) as { m: number }).m;
  try { db().prepare("INSERT INTO option_values (group_id,key,label,swatch,detail,sort_order) VALUES (?,?,?,?,?,?)").run(gid, key, label, s(f, "swatch"), s(f, "detail"), max + 10); } catch { /* duplicate key */ }
  revalidatePath("/admin/options"); revalidatePath("/design", "layout");
}
export async function deleteOptionValue(f: FormData) {
  await requireAdmin();
  db().prepare("DELETE FROM option_values WHERE id=?").run(Number(f.get("id")));
  revalidatePath("/admin/options"); revalidatePath("/design", "layout");
}
export async function toggleGroup(f: FormData) {
  await requireAdmin();
  db().prepare("UPDATE option_groups SET enabled=? WHERE id=?").run(f.get("enabled") ? 1 : 0, Number(f.get("id")));
  revalidatePath("/admin/options"); revalidatePath("/design", "layout");
}
export async function addRule(f: FormData) {
  await requireAdmin();
  const [ig, iv] = s(f, "if").split(":"), [tg, tv] = s(f, "then").split(":");
  if (!ig || !iv || !tg || !tv || ig === tg) return;
  db().prepare("INSERT INTO option_rules (configurator,if_group,if_value,then_group,then_value,note) VALUES (?,?,?,?,?,?)").run(s(f, "configurator"), ig, iv, tg, tv, s(f, "note"));
  revalidatePath("/admin/options"); revalidatePath("/design", "layout");
}
export async function deleteRule(f: FormData) {
  await requireAdmin();
  db().prepare("DELETE FROM option_rules WHERE id=?").run(Number(f.get("id")));
  revalidatePath("/admin/options"); revalidatePath("/design", "layout");
}

// ---------------- settings ----------------
export async function saveSiteSettings(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const cur = getSettings();
  const next: SiteSettings = JSON.parse(JSON.stringify(cur));
  for (const k of Object.keys(DEFAULT_SETTINGS.brand) as (keyof SiteSettings["brand"])[]) if (f.has(`brand.${k}`)) next.brand[k] = s(f, `brand.${k}`);
  for (const k of Object.keys(DEFAULT_SETTINGS.contact) as (keyof SiteSettings["contact"])[]) if (f.has(`contact.${k}`)) next.contact[k] = s(f, `contact.${k}`);
  for (const k of Object.keys(DEFAULT_SETTINGS.story) as (keyof SiteSettings["story"])[]) if (f.has(`story.${k}`)) next.story[k] = s(f, `story.${k}`);
  next.hero.image = s(f, "hero.image"); next.hero.imageAlt = s(f, "hero.imageAlt") || cur.hero.imageAlt;
  next.making = next.making.map((m, i) => ({ ...m, title: s(f, `making.${i}.title`) || m.title, caption: s(f, `making.${i}.caption`) || m.caption, image: s(f, `making.${i}.image`) }));
  next.flags = { legacyClaimVerified: !!f.get("flags.legacyClaimVerified"), guaranteeVerified: !!f.get("flags.guaranteeVerified"), contactVerified: !!f.get("flags.contactVerified") };
  if (next.contact.email && !/^\S+@\S+\.\S+$/.test(next.contact.email)) return { error: "That email address doesn't look right." };
  if (next.contact.whatsapp && next.contact.whatsapp.replace(/\D/g, "").length < 10) return { error: "WhatsApp number should include the country code, e.g. 91XXXXXXXXXX." };
  next.contact.whatsapp = next.contact.whatsapp.replace(/\D/g, "");
  saveSettings(next);
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

// ---------------- import ----------------
export async function runImport(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const file = f.get("file") as File;
  if (!file || !file.size) return { error: "Choose a CSV file." };
  if (file.size > 5 * 1024 * 1024) return { error: "File is larger than 5 MB." };
  if (/\.xlsx?$/i.test(file.name)) return { error: "Excel files aren't read directly. In Excel choose File → Save As → CSV (UTF-8), or export CSV from Tally, then upload that." };
  try {
    const r = importInventory(db(), file.name, await file.text());
    revalidatePath("/admin/products"); revalidatePath("/admin/import");
    return { ok: true, message: r.lines.join("\n") };
  } catch (e) { return { error: (e as Error).message }; }
}
