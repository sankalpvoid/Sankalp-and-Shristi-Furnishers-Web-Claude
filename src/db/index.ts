import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema";
import { seedDatabase } from "./seed";

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data"));

type DB = Database.Database;
const g = globalThis as unknown as { __ssfiDb?: DB };

export function db(): DB {
  if (g.__ssfiDb) return g.__ssfiDb;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const conn = new Database(path.join(DATA_DIR, "ssfi.db"));
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  conn.exec(SCHEMA_SQL);
  g.__ssfiDb = conn;
  // First run: load starter data.
  const has = conn.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
  if (has.n === 0) {
    seedDatabase(conn);
  }
  return conn;
}

export function resetDbForTests(conn: DB) {
  g.__ssfiDb = conn;
}

export const bool = (v: unknown) => (v ? 1 : 0);
