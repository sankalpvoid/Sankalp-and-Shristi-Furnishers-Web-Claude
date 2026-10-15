import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SCHEMA_SQL } from "../src/db/schema";
import { seedDatabase } from "../src/db/seed";
import { importInventory, parseCsv, parseInventory } from "../src/lib/import";

function fresh() { const c = new Database(":memory:"); c.exec(SCHEMA_SQL); seedDatabase(c); return c; }
const tally = `Stock Summary\r\n"Particulars","Closing Balance","Rate","Value"\r\n"Teak Bed 6x6","3 nos","25000","75000"\r\n"Mystery Item",,,\r\n"Grand Total",,,\r\n`;

describe("inventory import", () => {
  it("parses quoted CSV", () => { expect(parseCsv('a,"b,c",d\n1,"x""y",3')).toEqual([["a", "b,c", "d"], ["1", 'x"y', "3"]]); });
  it("finds header row after preamble", () => { expect(parseInventory(tally)?.headerRow).toBe(1); });
  it("imports safely: needs_review, hidden price, no public price from rate", () => {
    const c = fresh();
    const r = importInventory(c, "t.csv", tally);
    expect(r.imported).toBe(2); expect(r.skipped).toBe(1);
    const p = c.prepare("SELECT * FROM products WHERE name='Teak Bed 6x6'").get() as Record<string, unknown>;
    expect(p.status).toBe("needs_review"); expect(p.source).toBe("tally_import"); expect(p.price_visibility).toBe("hidden"); expect(p.price_inr).toBeNull(); expect(p.quantity).toBe(3);
    expect(importInventory(c, "t.csv", tally).imported).toBe(0); // idempotent
  });
  it("rejects unterminated quotes, empty and binary files", () => {
    const c = fresh();
    expect(() => importInventory(c, "x.csv", 'Name,Qty\n"Broken,1\n')).toThrow(/never closed/);
    expect(() => importInventory(c, "x.csv", "   \n")).toThrow(/empty/);
    expect(() => importInventory(c, "x.csv", "PK\u0003\u0004\u0000\u0000binary")).toThrow();
    expect(() => importInventory(c, "x.csv", "foo,bar\n1,2\n")).toThrow(/header row/);
    expect((c.prepare("SELECT COUNT(*) n FROM products WHERE source='tally_import'").get() as { n: number }).n).toBe(0);
  });
  it("never invents values and reports invalid ones", () => {
    const c = fresh();
    const csv = "Name,Qty,Price,Item Code,Category\nGood Bed,abc,xyz,,Beds\nGood Bed,2,100,,Beds\nNeg Sofa,-4,,S1,Sofas\nOdd Thing,,,,Spaceships\n";
    const r = importInventory(c, "x.csv", csv);
    expect(r.imported).toBe(3); expect(r.skipped).toBe(1);
    const rows = c.prepare("SELECT * FROM products WHERE source='tally_import' ORDER BY id").all() as Record<string, unknown>[];
    for (const p of rows) { expect(p.status).toBe("needs_review"); expect(p.price_visibility).toBe("hidden"); expect(p.verification).toBe("needs_review"); expect(p.availability).toBe("enquire"); }
    const bed = rows.find((p) => p.name === "Good Bed")!;
    expect(bed.quantity).toBeNull(); expect(bed.price_inr).toBeNull(); expect(bed.sku).toBe("");
    expect(rows.find((p) => p.name === "Neg Sofa")!.quantity).toBeNull();
    expect(rows.find((p) => p.name === "Odd Thing")!.category_id).toBeNull();
    expect(r.lines.join("\n")).toMatch(/not a valid number/);
  });
});
