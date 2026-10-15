import type Database from "better-sqlite3";
import { CATEGORIES, DEFAULT_RULES, OPTION_CATALOG, SEED_PRODUCTS } from "./seed-data";

/**
 * Starter data. IMPORTANT: no Tally inventory was available when this was
 * written. Products here are PROPOSED SEED products (source = proposed_seed,
 * verification = unverified) built from the product types discussed with the
 * owner. They have no prices, quantities, SKUs or photographs.
 */
export function seedDatabase(conn: Database.Database) {
  const tx = conn.transaction(() => {
    const insCat = conn.prepare(
      "INSERT OR IGNORE INTO categories (slug,name,group_name,description,art_kind,sort_order,origin) VALUES (?,?,?,?,?,?, 'business_context')",
    );
    CATEGORIES.forEach((c, i) => insCat.run(c.slug, c.name, c.group, c.desc, c.art, (i + 1) * 10));

    const insG = conn.prepare(
      "INSERT OR IGNORE INTO option_groups (configurator,key,label,help,kind,show_when,sort_order) VALUES (?,?,?,?,?,?,?)",
    );
    const insV = conn.prepare(
      "INSERT OR IGNORE INTO option_values (group_id,key,label,swatch,detail,sort_order) VALUES (?,?,?,?,?,?)",
    );
    for (const [conf, groups] of Object.entries(OPTION_CATALOG)) {
      groups.forEach((g, gi) => {
        insG.run(conf, g.key, g.label, g.help ?? "", g.kind ?? "choice", g.show_when ? JSON.stringify(g.show_when) : "", (gi + 1) * 10);
        const gid = (conn.prepare("SELECT id FROM option_groups WHERE configurator=? AND key=?").get(conf, g.key) as { id: number }).id;
        g.values.forEach((v, vi) => insV.run(gid, v.key, v.label, v.swatch ?? "", v.detail ?? "", (vi + 1) * 10));
      });
    }
    const insR = conn.prepare(
      "INSERT INTO option_rules (configurator,if_group,if_value,then_group,then_value,note) VALUES (?,?,?,?,?,?)",
    );
    DEFAULT_RULES.forEach((r) => insR.run(r.c, r.ig, r.iv, r.tg, r.tv, r.note));

    const insP = conn.prepare(`INSERT OR IGNORE INTO products
      (slug,name,category_id,subcategory,short_description,description,material,sizes,colours,upholstery,
       availability,price_visibility,sales_method,customisable,configurator,art,status,featured,source,verification,internal_notes)
      VALUES (?,?,?,?,?,?,?,?,?,?, 'enquire','hidden',?,?,?,?, 'published',?, 'proposed_seed','unverified',
      'Proposed seed product — not from Tally. Confirm it is made/stocked, add photos, sizes and (if wanted) a price.')`);
    for (const p of SEED_PRODUCTS) {
      const cat = conn.prepare("SELECT id FROM categories WHERE slug=?").get(p.cat) as { id: number } | undefined;
      insP.run(
        p.slug, p.name, cat?.id ?? null, p.sub ?? "", p.short, p.long, p.material,
        JSON.stringify(p.sizes ?? []), JSON.stringify(p.colours ?? []), JSON.stringify(p.upholstery ?? []),
        p.configurator ? "custom_config" : "quote", p.configurator ? 1 : 0, p.configurator ?? "",
        JSON.stringify(p.art), p.featured ? 1 : 0,
      );
    }
  });
  tx();
}
