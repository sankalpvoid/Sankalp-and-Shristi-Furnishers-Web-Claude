import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS, SCHEMA_SQL, SCHEMA_VERSION } from "./schema";
import { seedDatabase } from "./seed";

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "data"));
if (process.env.NODE_ENV === "production" && !process.env.DATA_DIR) {
  console.warn("[ssfi] DATA_DIR is not set: using ./data. Make sure this directory is on a PERSISTENT disk or volume, otherwise enquiries and products will be lost on restart.");
}

type DB = Database.Database;
const g = globalThis as unknown as { __ssfiDb?: DB };

export function db(): DB {
  if (g.__ssfiDb) return g.__ssfiDb;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const conn = new Database(path.join(DATA_DIR, "ssfi.db"));
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  conn.exec(SCHEMA_SQL);
  runMigrations(conn);
  g.__ssfiDb = conn;
  // First run: load starter data.
  const has = conn.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
  if (has.n === 0) {
    seedDatabase(conn);
  }
  return conn;
}

function runMigrations(conn: DB) {
  const row = conn.prepare("SELECT value FROM meta WHERE key='schema_version'").get() as { value: string } | undefined;
  const current = row ? Number(row.value) : 0;
  for (const m of MIGRATIONS.filter((x) => x.version > current).sort((a, b) => a.version - b.version)) {
    conn.transaction(() => { conn.exec(m.sql); conn.prepare("INSERT INTO meta (key,value) VALUES ('schema_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(m.version)); })();
  }
  const latest = Math.max(SCHEMA_VERSION, ...MIGRATIONS.map((m) => m.version));
  conn.prepare("INSERT INTO meta (key,value) VALUES ('schema_version',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(latest));
}

export function resetDbForTests(conn: DB) {
  g.__ssfiDb = conn;
}

export const bool = (v: unknown) => (v ? 1 : 0);
