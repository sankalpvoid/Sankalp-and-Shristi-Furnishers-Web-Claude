import type Database from "better-sqlite3";
import { slugify } from "./util";

/** Minimal RFC-4180-ish CSV parser (quotes, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x.trim() !== "")) rows.push(row); row = []; }
    else cur += c;
  }
  if (q) throw new Error("This file is not valid CSV: a quoted value is never closed. Check for a stray \" character and re-export.");
  row.push(cur); if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

const ALIASES: Record<string, string[]> = {
  name: ["name", "item name", "stock item", "stock item name", "particulars", "product", "product name", "item"],
  sku: ["sku", "part no", "part number", "item code", "code", "alias"],
  category: ["category", "stock group", "group", "under", "stock category"],
  subcategory: ["subcategory", "sub category"],
  short_description: ["short_description", "short description"],
  description: ["description", "narration", "details"],
  material: ["material"],
  finish: ["finish"],
  dimensions: ["dimensions", "size"],
  sizes: ["sizes"],
  colours: ["colours", "colors", "colour", "color"],
  upholstery: ["upholstery", "fabric"],
  availability: ["availability"],
  quantity: ["quantity", "qty", "closing balance", "closing qty", "closing stock", "closing quantity"],
  price_inr: ["price_inr", "price", "selling price", "mrp"],
  rate: ["rate", "standard cost", "standard price", "closing value", "value"],
  unit: ["unit", "uom", "units"],
  sales_method: ["sales_method"],
  customisable: ["customisable", "customizable"],
  source_ref: ["source_ref"],
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9_ ]/g, " ").replace(/\s+/g, " ").trim();

export interface ParsedFile { headers: string[]; mapped: Record<string, number>; records: Record<string, string>[]; unmappedHeaders: string[]; headerRow: number }

export function parseInventory(text: string): ParsedFile | null {
  if (!text.trim()) throw new Error("The file is empty.");
  if (/[\u0000-\u0008\u000E-\u001F]/.test(text.slice(0, 4000))) throw new Error("This doesn't look like a text CSV file (it contains binary data). Export or save as CSV (UTF-8) and try again.");
  const rows = parseCsv(text);
  let headerRow = -1;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const hs = rows[i].map(norm);
    if (hs.some((h) => ALIASES.name.includes(h)) && hs.filter(Boolean).length >= 1 && (i === rows.length - 1 || rows.length > 1)) { headerRow = i; break; }
  }
  if (headerRow < 0) return null;
  const headers = rows[headerRow].map((h) => h.trim());
  const mapped: Record<string, number> = {};
  const used = new Set<number>();
  headers.forEach((h, idx) => {
    for (const [field, names] of Object.entries(ALIASES)) {
      if (!(field in mapped) && names.includes(norm(h))) { mapped[field] = idx; used.add(idx); break; }
    }
  });
  const records = rows.slice(headerRow + 1).map((r) => {
    const o: Record<string, string> = {};
    for (const [f, idx] of Object.entries(mapped)) o[f] = (r[idx] ?? "").trim();
    return o;
  });
  return { headers, mapped, records, unmappedHeaders: headers.filter((_, i) => !used.has(i) && headers[i]), headerRow };
}

export interface ImportResult { total: number; imported: number; skipped: number; lines: string[]; importId: number }

const splitList = (s: string) => JSON.stringify(s.split(/[;|\n]/).map((x) => x.trim()).filter(Boolean));

/**
 * Import inventory rows as products.
 * SAFE DEFAULTS: status needs_review, verification needs_review, price hidden, source tally_import.
 * Tally "rate"/value columns are never made customer-visible; they go to internal notes only.
 */
export function importInventory(conn: Database.Database, filename: string, text: string): ImportResult {
  const parsed = parseInventory(text);
  if (!parsed) throw new Error("Could not find a header row with an item name column (e.g. 'Name', 'Stock Item', 'Particulars').");
  const cats = conn.prepare("SELECT id, slug, name FROM categories").all() as { id: number; slug: string; name: string }[];
  const matchCat = (raw: string) => {
    const k = slugify(raw).replace(/-s$/, "");
    return cats.find((c) => slugify(c.name) === slugify(raw) || c.slug === slugify(raw) || slugify(c.name).replace(/s$/, "") === k.replace(/s$/, ""));
  };
  const lines: string[] = [];
  let imported = 0, skipped = 0;
  const src = conn.prepare("INSERT INTO import_sources (filename,kind,rows_total) VALUES (?,?,?)").run(filename, "csv", parsed.records.length);
  const importId = Number(src.lastInsertRowid);
  const findBySlug = conn.prepare("SELECT id FROM products WHERE slug=?");
  // Compare on a normalised key so "Teak Bed, King" and "Teak Bed King" count as the same item.
  const seen = new Set((conn.prepare("SELECT source_ref FROM products WHERE source_ref<>''").all() as { source_ref: string }[]).map((r) => slugify(r.source_ref)));
  const ins = conn.prepare(`INSERT INTO products (slug,sku,name,category_id,subcategory,short_description,description,material,finish,dimensions,sizes,colours,upholstery,availability,quantity,price_inr,price_visibility,sales_method,customisable,status,source,verification,source_ref,import_id,internal_notes,art)
    VALUES (@slug,@sku,@name,@category_id,@subcategory,@short,@description,@material,@finish,@dimensions,@sizes,@colours,@upholstery,'enquire',@quantity,@price,'hidden',@sales,@custom,'needs_review','tally_import','needs_review',@ref,@import_id,@notes,@art)`);

  const tx = conn.transaction(() => {
    parsed.records.forEach((r, i) => {
      const rowNo = parsed.headerRow + 2 + i;
      const name = r.name?.trim();
      if (!name || /^(grand )?total$/i.test(name)) { skipped++; if (name) lines.push(`Row ${rowNo}: skipped "${name}" (total row)`); else lines.push(`Row ${rowNo}: skipped (no item name)`); return; }
      const ref = r.source_ref || name;
      if (seen.has(slugify(ref))) { skipped++; lines.push(`Row ${rowNo}: skipped "${name}" (duplicate of an item already imported)`); return; }
      const base = slugify(name.slice(0, 120));
      seen.add(slugify(ref));
      let slug = base, n = 2;
      while (findBySlug.get(slug)) slug = `${base}-${n++}`;
      const cat = r.category ? matchCat(r.category) : undefined;
      const notes: string[] = ["Imported from inventory file. Review everything before publishing."];
      if (r.category && !cat) notes.push(`Category "${r.category}" did not match a website category — choose one.`);
      if (r.rate) notes.push(`Inventory rate/value "${r.rate}" kept here for reference only (not shown publicly; unverified meaning).`);
      if (r.unit) notes.push(`Unit: ${r.unit}`);
      const clean = (v: string) => v.replace(/[\u0000-\u001F]/g, " ").trim();
      const warn: string[] = [];
      let qty = NaN;
      if (r.quantity) {
        qty = parseFloat(r.quantity.replace(/,/g, "").match(/-?\d+(\.\d+)?/)?.[0] ?? "");
        if (!Number.isFinite(qty) || qty < 0) { warn.push(`quantity "${r.quantity}" is not a valid number — left blank`); qty = NaN; }
      }
      let price = NaN;
      if (r.price_inr) {
        price = Math.round(parseFloat(r.price_inr.replace(/[₹,\s]/g, "")));
        if (!Number.isFinite(price) || price < 0) { warn.push(`price "${r.price_inr}" is not a valid amount — ignored`); price = NaN; }
        else notes.push(`Price column value ${price} imported but NOT shown publicly — set price visibility yourself.`);
      }
      if (name.length > 120) warn.push("name was longer than 120 characters and was shortened");
      if (!cat && r.category) warn.push(`category "${r.category}" did not match — product left uncategorised`);
      if (!r.sku) warn.push("no SKU/item code — left blank (none invented)");
      if (warn.length) lines.push(`Row ${rowNo} "${name.slice(0, 40)}": ${warn.join("; ")}`);
      ins.run({
        slug, sku: clean(r.sku || "").slice(0, 60), name: clean(name).slice(0, 120), category_id: cat?.id ?? null, subcategory: r.subcategory || "",
        short: r.short_description || "", description: r.description || "", material: r.material || "", finish: r.finish || "", dimensions: r.dimensions || "",
        sizes: splitList(r.sizes || ""), colours: splitList(r.colours || ""), upholstery: splitList(r.upholstery || ""),
        quantity: Number.isFinite(qty) ? Math.round(qty) : null, price: Number.isFinite(price) ? price : null,
        sales: ["fixed_price", "quote", "custom_config", "online_future"].includes(r.sales_method) ? (r.sales_method === "fixed_price" ? "quote" : r.sales_method) : "quote",
        custom: /^(1|yes|true|y)$/i.test(r.customisable || "") ? 1 : 0,
        ref, import_id: importId, notes: notes.join("\n"),
        art: JSON.stringify({ kind: cat ? (conn.prepare("SELECT art_kind FROM categories WHERE id=?").get(cat.id) as { art_kind: string }).art_kind : "sofa" }),
      });
      imported++;
    });
  });
  tx();
  const mappedNames = Object.keys(parsed.mapped).join(", ");
  const head = [`File: ${filename}`, `Header row: ${parsed.headerRow + 1}`, `Columns used: ${mappedNames || "none"}`, parsed.unmappedHeaders.length ? `Columns ignored: ${parsed.unmappedHeaders.join(", ")}` : "No ignored columns", `Imported ${imported}, skipped ${skipped} of ${parsed.records.length} rows`];
  const report = [...head, ...lines].join("\n");
  conn.prepare("UPDATE import_sources SET rows_imported=?, rows_skipped=?, report=? WHERE id=?").run(imported, skipped, report, importId);
  return { total: parsed.records.length, imported, skipped, lines: [...head, ...lines], importId };
}
