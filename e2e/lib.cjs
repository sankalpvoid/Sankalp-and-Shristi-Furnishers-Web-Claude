// Shared helpers for the browser journeys. Run with:  NODE_PATH=$(npm root -g) node e2e/configurators.cjs
const { chromium } = require("playwright");
const Database = require("better-sqlite3");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3100";
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const ADMIN_USER = process.env.ADMIN_USERNAME || "owner";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "dev-only-Passw0rd-123";

let failures = 0;
const check = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) failures++; };
const launch = () => chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const dbRows = (sql, ...args) => {
  const d = new Database(path.join(process.env.DATA_DIR || path.join(__dirname, "..", "data"), "ssfi.db"), { readonly: true });
  try { return d.prepare(sql).all(...args); } finally { d.close(); }
};
async function adminLogin(page) {
  await page.goto(BASE + "/admin/login");
  await page.fill("#username", ADMIN_USER); await page.fill("#password", ADMIN_PASS);
  await page.click("button:has-text('Sign in')"); await page.waitForURL("**/admin");
}
const pick = (page, name, value) => page.locator(`input[name=${name}][value="${value}"]`).check({ force: true });
const finish = async (b) => { await b.close(); console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASSED"); process.exit(failures ? 1 : 0); };
module.exports = { BASE, check, launch, dbRows, adminLogin, pick, finish, ADMIN_PASS };
