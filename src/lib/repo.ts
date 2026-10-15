import { db } from "@/db";
import type {
  ArtParams, Category, ConfiguratorType, ConfigurationRow, EnquiryRow, OptionGroup, OptionRule,
  OptionValue, ProductRow, PublicProduct, Selections,
} from "./types";
import { parseJson } from "./util";
import { getSettings } from "./settings";

// ---------- categories ----------
export function listCategories(opts: { includeHidden?: boolean } = {}): Category[] {
  const sql = `SELECT * FROM categories ${opts.includeHidden ? "" : "WHERE visible=1"} ORDER BY sort_order, name`;
  return db().prepare(sql).all() as Category[];
}
export function getCategoryBySlug(slug: string): Category | undefined {
  return db().prepare("SELECT * FROM categories WHERE slug=?").get(slug) as Category | undefined;
}
/** Categories with at least one published product, or any visible category (shown as 'coming soon' cards). */
export function productCountByCategory(): Record<number, number> {
  const rows = db().prepare("SELECT category_id, COUNT(*) n FROM products WHERE status='published' GROUP BY category_id").all() as { category_id: number; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.category_id, r.n]));
}

// ---------- products ----------
const PRODUCT_SELECT = `SELECT p.*, c.slug AS cat_slug, c.name AS cat_name, (SELECT COUNT(*) FROM product_images i WHERE i.product_id=p.id) AS img_count FROM products p LEFT JOIN categories c ON c.id=p.category_id`;
type Joined = ProductRow & { cat_slug: string | null; cat_name: string | null; img_count: number };

function imagesFor(id: number) {
  return db().prepare("SELECT url, alt FROM product_images WHERE product_id=? ORDER BY sort_order, id").all(id) as { url: string; alt: string }[];
}

/** Whitelist mapper: the ONLY path from DB row to a browser-visible product. */
export function toPublic(r: Joined): PublicProduct {
  const verified = r.verification === "verified";
  const guaranteeOk = getSettings().flags.guaranteeVerified;
  const art = parseJson<ArtParams>(r.art, { kind: "sofa" });
  return {
    id: r.id, slug: r.slug, name: r.name,
    categorySlug: r.cat_slug ?? "", categoryName: r.cat_name ?? "",
    subcategory: r.subcategory, shortDescription: r.short_description, description: r.description,
    material: r.material, finish: r.finish, dimensions: r.dimensions,
    sizes: parseJson<string[]>(r.sizes, []), colours: parseJson<string[]>(r.colours, []), upholstery: parseJson<string[]>(r.upholstery, []),
    // Unverified records can never present themselves as confirmed stock or carry a public price.
    availability: verified || r.availability === "made_to_order" ? r.availability : "enquire",
    price: verified && r.price_visibility === "show" && r.sales_method === "fixed_price" && r.price_inr ? r.price_inr : null,
    salesMethod: r.sales_method, customisable: !!r.customisable, configurator: r.configurator,
    warranty: guaranteeOk ? r.warranty_text : "", art, images: imagesFor(r.id), featured: !!r.featured,
    isSample: !verified,
    sampleKind: r.source === "proposed_seed" ? "sample" : "unconfirmed",
  };
}

export function listPublishedProducts(filter: { categorySlug?: string; featured?: boolean; q?: string; limit?: number; excludeId?: number } = {}): PublicProduct[] {
  const where = ["p.status='published'", "(c.id IS NULL OR c.visible=1)"];
  const args: (string | number)[] = [];
  if (filter.categorySlug) { where.push("c.slug=?"); args.push(filter.categorySlug); }
  if (filter.featured) where.push("p.featured=1");
  if (filter.excludeId) { where.push("p.id<>?"); args.push(filter.excludeId); }
  if (filter.q) { where.push("(p.name LIKE ? OR p.short_description LIKE ? OR c.name LIKE ?)"); const q = `%${filter.q}%`; args.push(q, q, q); }
  const sql = `${PRODUCT_SELECT} WHERE ${where.join(" AND ")} ORDER BY p.featured DESC, c.sort_order, p.name ${filter.limit ? "LIMIT " + Number(filter.limit) : ""}`;
  return (db().prepare(sql).all(...args) as Joined[]).map(toPublic);
}
export function getPublishedProduct(slug: string): PublicProduct | undefined {
  const r = db().prepare(`${PRODUCT_SELECT} WHERE p.slug=? AND p.status='published' AND (c.id IS NULL OR c.visible=1)`).get(slug) as Joined | undefined;
  return r ? toPublic(r) : undefined;
}
export function getPublishedProductsByIds(ids: number[]): PublicProduct[] {
  if (!ids.length) return [];
  const ph = ids.map(() => "?").join(",");
  return (db().prepare(`${PRODUCT_SELECT} WHERE p.id IN (${ph}) AND p.status='published'`).all(...ids) as Joined[]).map(toPublic);
}

// admin
export function adminListProducts(f: { status?: string; categoryId?: number; source?: string; q?: string } = {}) {
  const where = ["1=1"]; const args: (string | number)[] = [];
  if (f.status) { where.push("p.status=?"); args.push(f.status); }
  if (f.categoryId) { where.push("p.category_id=?"); args.push(f.categoryId); }
  if (f.source) { where.push("p.source=?"); args.push(f.source); }
  if (f.q) { where.push("(p.name LIKE ? OR p.sku LIKE ?)"); args.push(`%${f.q}%`, `%${f.q}%`); }
  return db().prepare(`${PRODUCT_SELECT} WHERE ${where.join(" AND ")} ORDER BY p.updated_at DESC, p.id DESC`).all(...args) as Joined[];
}
export function adminGetProduct(id: number) {
  return db().prepare("SELECT * FROM products WHERE id=?").get(id) as ProductRow | undefined;
}
export function adminProductImages(id: number) {
  return db().prepare("SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order,id").all(id) as { id: number; url: string; alt: string; sort_order: number }[];
}

// ---------- options ----------
export function getOptionGroups(conf: ConfiguratorType, opts: { includeDisabled?: boolean } = {}): OptionGroup[] {
  const groups = db().prepare(`SELECT * FROM option_groups WHERE configurator=? ${opts.includeDisabled ? "" : "AND enabled=1"} ORDER BY sort_order`).all(conf) as Omit<OptionGroup, "values">[];
  const stmt = db().prepare(`SELECT * FROM option_values WHERE group_id=? ${opts.includeDisabled ? "" : "AND enabled=1"} ORDER BY sort_order`);
  return groups.map((g) => ({ ...g, values: stmt.all(g.id) as OptionValue[] }));
}
export function getRules(conf: ConfiguratorType): OptionRule[] {
  return db().prepare("SELECT * FROM option_rules WHERE configurator=?").all(conf) as OptionRule[];
}
export function getProductLimits(productId: number): Record<string, string[]> {
  const rows = db().prepare("SELECT group_key, value_keys FROM product_option_limits WHERE product_id=?").all(productId) as { group_key: string; value_keys: string }[];
  return Object.fromEntries(rows.map((r) => [r.group_key, parseJson<string[]>(r.value_keys, [])]));
}

// ---------- configurations ----------
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
export function newRef(prefix: string): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `SSFI-${prefix}-${Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("")}`;
}
export function getConfiguration(ref: string): ConfigurationRow | undefined {
  return db().prepare("SELECT * FROM configurations WHERE ref=?").get(ref.trim().toUpperCase()) as ConfigurationRow | undefined;
}
export function insertConfiguration(c: { configurator: ConfiguratorType; prefix: string; productId: number | null; selections: Selections; summary: { label: string; value: string }[]; notes: string }): string {
  for (let i = 0; i < 5; i++) {
    const ref = newRef(c.prefix);
    try {
      db().prepare("INSERT INTO configurations (ref,configurator,product_id,selections,summary,notes) VALUES (?,?,?,?,?,?)")
        .run(ref, c.configurator, c.productId, JSON.stringify(c.selections), JSON.stringify(c.summary), c.notes);
      return ref;
    } catch (e) { if (i === 4) throw e; }
  }
  throw new Error("Could not allocate a reference");
}

// ---------- enquiries ----------
export function getEnquiry(id: number) {
  return db().prepare("SELECT * FROM enquiries WHERE id=?").get(id) as EnquiryRow | undefined;
}
export function enquiryNotes(id: number) {
  return db().prepare("SELECT * FROM enquiry_notes WHERE enquiry_id=? ORDER BY id DESC").all(id) as { id: number; author: string; body: string; created_at: string }[];
}
export function listEnquiries(f: { status?: string; q?: string; type?: string; productId?: number; from?: string; to?: string; due?: boolean } = {}) {
  const where = ["1=1"]; const args: (string | number)[] = [];
  if (f.status) { where.push("status=?"); args.push(f.status); }
  if (f.type) { where.push("type=?"); args.push(f.type); }
  if (f.productId) { where.push("product_id=?"); args.push(f.productId); }
  if (f.from) { where.push("date(created_at)>=date(?)"); args.push(f.from); }
  if (f.to) { where.push("date(created_at)<=date(?)"); args.push(f.to); }
  if (f.due) where.push("follow_up_date<>'' AND date(follow_up_date)<=date('now') AND status NOT IN ('converted','lost')");
  if (f.q) { where.push("(name LIKE ? OR phone LIKE ? OR email LIKE ? OR config_ref LIKE ? OR product_name LIKE ? OR message LIKE ?)"); const q = `%${f.q}%`; args.push(q, q, q, q, q, q); }
  return db().prepare(`SELECT * FROM enquiries WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT 500`).all(...args) as EnquiryRow[];
}
export function enquiryCounts() {
  const rows = db().prepare("SELECT status, COUNT(*) n FROM enquiries GROUP BY status").all() as { status: string; n: number }[];
  const due = (db().prepare("SELECT COUNT(*) n FROM enquiries WHERE follow_up_date<>'' AND date(follow_up_date)<=date('now') AND status NOT IN ('converted','lost')").get() as { n: number }).n;
  return { byStatus: Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<string, number>, due };
}
