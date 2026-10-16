// Writes src/lib/renders-manifest.json (list of available render files) so the app needs no
// filesystem access at runtime (works on serverless hosts).
const fs = require("node:fs"), path = require("node:path");
const dir = path.resolve(__dirname, "..", "..", "public", "renders");
const out = [];
(function walk(d, rel = "") { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name.startsWith("_")) continue; if (e.isDirectory()) walk(path.join(d, e.name), rel + e.name + "/"); else if (e.name.endsWith(".webp")) out.push(rel + e.name); } })(dir);
fs.writeFileSync(path.resolve(__dirname, "..", "..", "src", "lib", "renders-manifest.json"), JSON.stringify(out.sort(), null, 1) + "\n");
console.log(`manifest: ${out.length} files`);
