import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { resetDbForTests } from "../src/db";
import { SCHEMA_SQL } from "../src/db/schema";
import { seedDatabase } from "../src/db/seed";
import { getPublishedProduct, listPublishedProducts } from "../src/lib/repo";
import { DEFAULT_SETTINGS } from "../src/lib/site-defaults";
import { publicClaims } from "../src/lib/settings";

const root = path.resolve(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
}

describe("admin protection (static)", () => {
  const src = read("src/app/admin/actions.ts");
  it("every exported server action except login/logout calls requireAdmin first", () => {
    const parts = src.split(/^export async function /m).slice(1);
    expect(parts.length).toBeGreaterThan(15);
    for (const part of parts) {
      const name = part.slice(0, part.indexOf("("));
      if (name === "login" || name === "logout") continue;
      const body = part.slice(0, 400);
      expect(body, `${name} must call requireAdmin()`).toMatch(/await requireAdmin\(\)/);
    }
  });
  it("actions file exports only async functions (anything else becomes a public endpoint)", () => {
    const exports = src.match(/^export (?!async function|type )[^\n]*/gm) ?? [];
    expect(exports).toEqual([]);
  });
  it("every admin page and the admin layout call requireAdmin", () => {
    const pages = walk(path.join(root, "src/app/admin/(panel)")).filter((f) => /(page|layout)\.tsx$/.test(f));
    expect(pages.length).toBeGreaterThan(8);
    for (const f of pages) expect(fs.readFileSync(f, "utf8"), f).toMatch(/requireAdmin\(\)/);
  });
  it("no admin route handlers exist outside server actions", () => {
    expect(walk(path.join(root, "src/app/admin")).filter((f) => /route\.ts$/.test(f))).toEqual([]);
  });
  it("secrets are never referenced from client components", () => {
    for (const f of walk(path.join(root, "src")).filter((f) => /\.tsx?$/.test(f))) {
      const t = fs.readFileSync(f, "utf8");
      if (/^\s*["']use client["']/.test(t)) expect(t, f).not.toMatch(/ADMIN_PASSWORD|SESSION_SECRET|process\.env\.(?!NEXT_PUBLIC)/);
    }
  });
  it("env files are git-ignored and .env.example has no real secret", () => {
    expect(read(".gitignore")).toMatch(/^\.env$/m);
    expect(read(".gitignore")).toMatch(/^\.env\.local$/m);
    expect(read(".env.example")).toMatch(/SESSION_SECRET=\s*$/m);
  });
});

describe("public data exposure", () => {
  beforeAll(() => {
    const c = new Database(":memory:");
    c.exec(SCHEMA_SQL);
    seedDatabase(c);
    c.prepare("UPDATE products SET quantity=42, internal_notes='COST SECRET', source_ref='TALLY-REF', price_inr=9999, price_visibility='show', sales_method='fixed_price', availability='in_stock', warranty_text='5y' WHERE slug='wooden-stool'").run();
    resetDbForTests(c);
  });
  it("never serialises internal fields", () => {
    const json = JSON.stringify(getPublishedProduct("wooden-stool"));
    for (const secret of ["quantity", "internal_notes", "COST SECRET", "TALLY-REF", "source_ref", "import_id"]) expect(json).not.toContain(secret);
  });
  it("hides price, stock claim and guarantee for unverified products", () => {
    const p = getPublishedProduct("wooden-stool")!;
    expect(p.price).toBeNull();
    expect(p.availability).toBe("enquire");
    expect(p.warranty).toBe("");
    expect(p.isSample).toBe(true);
  });
  it("shows price only when verified + fixed price + shown", () => {
    const conn = (globalThis as unknown as { __ssfiDb: Database.Database }).__ssfiDb;
    conn.prepare("UPDATE products SET verification='verified' WHERE slug='wooden-stool'").run();
    expect(getPublishedProduct("wooden-stool")!.price).toBe(9999);
    conn.prepare("UPDATE products SET price_visibility='hidden' WHERE slug='wooden-stool'").run();
    expect(getPublishedProduct("wooden-stool")!.price).toBeNull();
  });
  it("draft, needs-review, unpublished and archived products are not listed", () => {
    const conn = (globalThis as unknown as { __ssfiDb: Database.Database }).__ssfiDb;
    for (const st of ["draft", "needs_review", "unpublished", "archived"]) {
      conn.prepare("UPDATE products SET status=? WHERE slug='wooden-stool'").run(st);
      expect(getPublishedProduct("wooden-stool")).toBeUndefined();
      expect(listPublishedProducts().find((p) => p.slug === "wooden-stool")).toBeUndefined();
    }
  });
});

describe("owner claims", () => {
  it("are hidden until verified, but kept as draft text", () => {
    expect(DEFAULT_SETTINGS.story.legacyClaim).toMatch(/Ring Road/);
    const hidden = publicClaims(DEFAULT_SETTINGS);
    expect(hidden.legacy).toBeNull();
    expect(hidden.guarantee).toBeNull();
    const shown = publicClaims({ ...DEFAULT_SETTINGS, flags: { ...DEFAULT_SETTINGS.flags, legacyClaimVerified: true, guaranteeVerified: true } });
    expect(shown.legacy).toMatch(/Ring Road/);
    expect(shown.guarantee?.headline).toBeTruthy();
  });
});
