import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, db } from "../src/db";

if (process.argv.includes("--reset")) {
  for (const f of ["ssfi.db", "ssfi.db-wal", "ssfi.db-shm"]) fs.rmSync(path.join(DATA_DIR, f), { force: true });
  console.log("Database removed.");
}
const n = (db().prepare("SELECT COUNT(*) n FROM products").get() as { n: number }).n;
console.log(`Database ready at ${DATA_DIR}/ssfi.db with ${n} products.`);
