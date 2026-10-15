import fs from "node:fs";
import { db } from "../src/db";
import { importInventory } from "../src/lib/import";

const file = process.argv[2];
if (!file) { console.error("Usage: npm run import:tally -- path/to/export.csv"); process.exit(1); }
const res = importInventory(db(), file.split("/").pop() || file, fs.readFileSync(file, "utf8"));
console.log(res.lines.join("\n"));
console.log("\nImported products are 'Needs review' and hidden from the public site until you publish them in Admin → Products.");
