const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const sharp = require("sharp");
const { BASE, check, launch, dbRows, adminLogin, finish, ADMIN_PASS } = require("./lib.cjs");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ssfi-e2e-"));
const write = (name, data) => { const f = path.join(tmp, name); fs.writeFileSync(f, data); return f; };
const dbWrite = (sql) => { const d = new Database(path.join(process.env.DATA_DIR || path.join(__dirname, "..", "data"), "ssfi.db")); d.exec(sql); d.close(); };

(async () => {
  dbWrite("DELETE FROM products WHERE name LIKE 'E2E%' OR source='tally_import'; DELETE FROM import_sources; DELETE FROM rate_limits; UPDATE products SET status='published' WHERE slug='wooden-stool';");
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));

  // ---------- SECURITY: anonymous ----------
  console.log("== security (anonymous)");
  const anon = await b.newContext(); const ar = anon.request;
  for (const p of ["/admin", "/admin/enquiries", "/admin/enquiries/1", "/admin/configurations?ref=SSFI-BED-AAAAAA", "/admin/products", "/admin/products/1", "/admin/products/new", "/admin/categories", "/admin/options", "/admin/settings", "/admin/import"]) {
    const r = await ar.get(BASE + p, { maxRedirects: 0 });
    const loc = r.headers()["location"] || "";
    check([302, 303, 307, 308].includes(r.status()) && loc.includes("/admin/login"), `anon ${p} → login redirect`);
    check(!(await r.text()).includes("Internal notes"), `anon ${p} leaks nothing`);
  }
  const forged = await b.newContext(); await forged.addCookies([{ name: "ssfi_admin", value: Buffer.from(JSON.stringify({ u: "owner", exp: 9999999999 })).toString("base64url") + ".AAAA", url: BASE }]);
  const fr = await forged.request.get(BASE + "/admin/enquiries", { maxRedirects: 0 });
  check(fr.status() >= 300 && fr.status() < 400, "forged session cookie rejected");
  check((await ar.get(BASE + "/api/enquiries")).status() === 405, "enquiry API has no GET (no data listing)");
  check((await ar.get(BASE + "/uploads/../../.env.local")).status() === 404, "uploads route is not path-traversable");
  check((await ar.get(BASE + "/uploads/0000000000000000.webp")).status() === 404, "missing upload 404");

  // replay a captured server action without a session
  await adminLogin(page);
  const before = dbRows("SELECT id, status FROM enquiries ORDER BY id LIMIT 1")[0];
  await page.goto(`${BASE}/admin/enquiries/${before.id}`, { waitUntil: "networkidle" });
  let captured = null;
  page.on("request", (rq) => { if (rq.method() === "POST" && rq.headers()["next-action"] && !captured) captured = { headers: rq.headers(), body: rq.postDataBuffer() }; });
  await page.click("button:has-text('Lost')"); await page.waitForTimeout(1200);
  check(!!captured, "captured a real server-action request");
  dbWrite(`UPDATE enquiries SET status='${before.status}' WHERE id=${before.id}`);
  if (captured) {
    const h = { ...captured.headers }; delete h.cookie; delete h["content-length"]; delete h.host;
    await ar.post(`${BASE}/admin/enquiries/${before.id}`, { headers: h, data: captured.body, maxRedirects: 0 });
    check(dbRows("SELECT status FROM enquiries WHERE id=?", before.id)[0].status === before.status, "replayed server action WITHOUT session did not change data");
  }

  // secrets not in client bundles
  const env = fs.existsSync(path.join(__dirname, "..", ".env.local")) ? fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8") : "";
  const secret = process.env.SESSION_SECRET || /SESSION_SECRET=(.+)/.exec(env)[1].trim();
  const home = await (await ar.get(BASE + "/")).text();
  const chunks = [...new Set([...home.matchAll(/\/_next\/static\/[^"')\s]+\.js/g)].map((m) => m[0]))];
  let leaked = false;
  for (const c of chunks) { const t = await (await ar.get(BASE + c)).text(); if (t.includes(ADMIN_PASS) || t.includes(secret)) leaked = true; }
  check(chunks.length > 0 && !leaked && !home.includes(ADMIN_PASS) && !home.includes(secret), `no secrets in HTML or ${chunks.length} client bundles`);
  check(!(await (await ar.get(BASE + "/shop")).text()).match(/internal_notes|quantity|source_ref/), "public HTML has no internal fields");

  // ---------- PRODUCT MANAGEMENT ----------
  console.log("\n== product management");
  await page.goto(BASE + "/admin/products/new");
  await page.fill("#name", "E2E Teak Console"); await page.selectOption("#category_id", { label: "Centre tables" });
  await page.fill("#short_description", "Test product"); await page.selectOption("#status", "published");
  await page.click("button:has-text('Create product')"); await page.waitForURL(/products\/\d+\?created=1/);
  const pid = /products\/(\d+)/.exec(page.url())[1];
  const row = () => dbRows("SELECT * FROM products WHERE id=?", pid)[0];
  check(row().verification === "needs_review" && row().price_visibility === "hidden" && row().source === "manual", "new product defaults: needs review, price hidden, manual source");
  const pub = await b.newContext(); const pp = await pub.newPage();
  const status = async () => (await pp.goto(`${BASE}/product/e2e-teak-console`)).status();
  check((await status()) === 200, "published product visible");
  await pp.goto(`${BASE}/shop/centre-tables`); check((await pp.locator("text=Details being confirmed").count()) >= 1, "unverified product labelled on listing");
  await pp.goto(`${BASE}/product/e2e-teak-console`); check((await pp.locator("text=still being confirmed").count()) === 1 && (await pp.locator("text=₹").count()) === 0, "product page shows unconfirmed notice, no price");

  const save = async () => {
    await Promise.all([page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/products")), page.click("button:has-text('Save changes')")]);
    await page.waitForTimeout(400);
  };
  await page.selectOption("#sales_method", "fixed_price"); await page.fill("#price_inr", "8000"); await page.selectOption("#price_visibility", "show"); await save();
  await page.waitForSelector("text=can only be shown publicly once the product is marked Verified");
  check(row().price_visibility === "hidden", "cannot show a price on an unverified product");
  await page.selectOption("#price_visibility", "hidden"); await page.selectOption("#availability", "in_stock"); await save();
  await page.waitForSelector("text=“In stock” can only be shown once");
  check(row().availability === "enquire", "cannot claim in-stock on an unverified product");
  await page.selectOption("#availability", "enquire"); await page.selectOption("#verification", "verified"); await page.selectOption("#price_visibility", "hidden"); await save(); await page.waitForSelector("text=Saved.");
  await pp.goto(`${BASE}/product/e2e-teak-console`); check((await pp.locator("text=₹").count()) === 0, "verified + price approved NOT shown while visibility hidden");
  await page.selectOption("#price_visibility", "show"); await save(); await page.waitForSelector("text=Saved.");
  await pp.goto(`${BASE}/product/e2e-teak-console`); check((await pp.locator("text=₹8,000").count()) >= 1, "price shown only after explicit approval");
  await page.fill("#name", "E2E Teak Console Edited"); await save(); await page.waitForSelector("text=Saved.");
  check(row().name === "E2E Teak Console Edited", "edit persisted");
  await page.selectOption("#status", "unpublished"); await save(); await page.waitForSelector("text=Saved.");
  check((await status()) === 404, "unpublished → 404 on storefront");
  await pp.goto(`${BASE}/shop`); check((await pp.locator("text=E2E Teak Console").count()) === 0, "unpublished absent from listing");
  await page.goto(`${BASE}/admin/products?q=E2E`); await page.click("button:has-text('Publish')"); await page.waitForTimeout(800);
  check(row().status === "published", "quick-publish works for verified product");
  await page.goto(`${BASE}/admin/products/${pid}`); await page.click("button:has-text('Archive')"); await page.waitForTimeout(800);
  check(row().status === "archived" && (await status()) === 404, "archived → hidden from storefront");
  // unverified seed product cannot be one-click published
  const seed = dbRows("SELECT id FROM products WHERE slug='wooden-stool'")[0].id;
  dbWrite(`UPDATE products SET status='unpublished' WHERE id=${seed}`);
  await page.goto(`${BASE}/admin/products?q=Wooden+Stool`);
  check((await page.locator("button:has-text('Publish')").count()) === 0 && (await page.locator("a:has-text('Review first')").count()) === 1, "unverified product offers 'Review first', not one-click publish");
  dbWrite(`UPDATE products SET status='published' WHERE id=${seed}`);
  await pp.goto(`${BASE}/product/wooden-stool`);
  check((await pp.locator("text=sample design").count()) >= 1 && (await pp.locator("text=₹").count()) === 0 && (await pp.locator("text=In stock").count()) === 0, "seed sample product: labelled, no price, no stock claim");

  // ---------- IMAGE UPLOAD ----------
  console.log("\n== image upload");
  await page.goto(`${BASE}/admin/products/${pid}`);
  const noise = await sharp({ create: { width: 2400, height: 1000, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 60 } } }).png().toBuffer();
  check(noise.length > 1.5 * 1024 * 1024, `test image is ${(noise.length / 1048576).toFixed(1)} MB (> default 1 MB action limit)`);
  const upload = async (file, alt = "") => { await page.setInputFiles("#file", file); await page.fill("#alt", alt); await page.click("button:has-text('Upload')"); };
  await upload(write("big.png", noise), "A test console");
  await page.waitForSelector("text=Image added.", { timeout: 20000 });
  const imgs = dbRows("SELECT * FROM product_images WHERE product_id=?", pid);
  check(imgs.length === 1 && /^\/uploads\/[a-f0-9]{16}\.webp$/.test(imgs[0].url), "large PNG uploaded and converted to WebP");
  const up = await ar.get(BASE + imgs[0].url); check(up.status() === 200 && up.headers()["content-type"] === "image/webp", "uploaded image is served");
  const meta = await sharp(await up.body()).metadata(); check(meta.width <= 1800, `image resized (${meta.width}px wide)`);
  await upload(write("notes.jpg", "this is not an image"));
  await page.waitForSelector("text=isn't a readable image"); check(true, "non-image rejected with a clear message");
  await upload(write("empty.png", Buffer.alloc(0)));
  await page.waitForSelector("text=Choose an image file"); check(true, "empty file rejected with a clear message");
  await upload(write("huge.png", Buffer.alloc(13 * 1024 * 1024, 1)));
  await page.waitForSelector("text=larger than 12 MB", { timeout: 30000 }); check(true, "oversized file rejected with a clear message");
  check(dbRows("SELECT COUNT(*) n FROM product_images WHERE product_id=?", pid)[0].n === 1, "failed uploads added nothing");
  dbWrite(`UPDATE products SET status='published' WHERE id=${pid}`);
  await pp.goto(`${BASE}/product/e2e-teak-console`); check((await pp.locator(`img[src="${imgs[0].url}"]`).count()) >= 1, "uploaded photo appears on product page (no placeholder tag)");

  // ---------- INVENTORY IMPORT ----------
  console.log("\n== inventory import (admin UI)");
  const doImport = async (file) => { await page.goto(BASE + "/admin/import"); await page.setInputFiles('input[type=file]', file); await page.click("button:has-text('Import')"); };
  const tally = 'Stock Summary,,,\r\nParticulars,Closing Balance,Rate,Value,Stock Group\r\n"Teak Bed, King",3 nos,"25,000","75,000",Beds\r\nTeak Bed King,1,,,Beds\r\nWing Chair,abc,xx,,Bedroom Chairs\r\nMystery Item,,,,Gadgets\r\n,5,,,Beds\r\nGrand Total,9,,,\r\n';
  await doImport(write("tally.csv", tally));
  await page.waitForSelector("text=Imported 3, skipped 3");
  const rep = await page.locator("form").last().innerText().catch(() => "");
  const imported = dbRows("SELECT * FROM products WHERE source='tally_import' ORDER BY id");
  check(imported.length === 3, "3 valid rows imported (duplicate, total and blank-name rows skipped)");
  check(imported.every((p) => p.status === "needs_review" && p.price_visibility === "hidden" && p.verification === "needs_review" && p.availability === "enquire" && p.sku === ""), "imported products: unpublished-style status, price hidden, no invented SKU");
  const king = imported.find((p) => p.name === "Teak Bed, King");
  check(king.quantity === 3 && king.price_inr === null && /25,000/.test(king.internal_notes), "quantity from file kept internally; rate not turned into a price");
  check(imported.find((p) => p.name === "Wing Chair").quantity === null, "invalid quantity left blank, not invented");
  check(imported.find((p) => p.name === "Mystery Item").category_id === null, "unknown category left uncategorised");
  await pp.goto(`${BASE}/shop?q=Teak+Bed`); check((await pp.locator("text=Teak Bed, King").count()) === 0, "imported products are not on the public site");
  check((await ar.get(BASE + "/product/teak-bed-king", { maxRedirects: 0 })).status() === 404, "imported product page 404s publicly");
  await doImport(write("tally.csv", tally)); await page.waitForSelector("text=Imported 0, skipped");
  check(dbRows("SELECT COUNT(*) n FROM products WHERE source='tally_import'")[0].n === 3, "re-import creates no duplicates");
  await doImport(write("bad.csv", 'Name,Qty\n"Broken item,1\n')); await page.waitForSelector("text=never closed"); check(true, "malformed CSV rejected with clear error");
  await doImport(write("bin.csv", Buffer.from([0x50, 0x4b, 3, 4, 0, 0, 0, 1, 2, 3, 4, 5]))); await page.waitForSelector("text=binary data"); check(true, "binary file rejected");
  await doImport(write("empty.csv", "")); await page.waitForSelector("text=Choose a CSV file"); check(true, "empty upload rejected");
  await doImport(write("blank.csv", "  \n")); await page.waitForSelector("text=file is empty"); check(true, "blank CSV rejected");
  await doImport(write("stock.xlsx", "x")); await page.waitForSelector("text=Save As → CSV"); check(true, "xlsx gets conversion guidance");
  await doImport(write("headeronly.csv", "Name,Qty\n")); await page.waitForSelector("text=Imported 0, skipped 0"); check(true, "header-only file handled");
  await doImport(write("nohdr.csv", "foo,bar\n1,2\n")); await page.waitForSelector("text=header row"); check(true, "file without item-name column rejected");
  await page.goto(BASE + "/admin/import"); check((await page.locator("summary").count()) >= 2, "import reports are listed");
  await page.goto(`${BASE}/admin/products?source=tally_import`); check((await page.locator("tbody tr").count()) === 3, "imported products listed in admin filtered by source");

  // ---------- LOGIN THROTTLE (last: it locks this IP out for a while) ----------
  console.log("\n== login throttle");
  const t = await (await b.newContext()).newPage(); let blocked = false;
  for (let i = 0; i < 10 && !blocked; i++) {
    await t.goto(BASE + "/admin/login"); await t.fill("#username", "owner"); await t.fill("#password", "wrong-" + i); await t.click("button:has-text('Sign in')");
    await t.waitForSelector(".notice[role=alert]"); blocked = (await t.locator(".notice[role=alert]").innerText()).includes("Too many");
  }
  check(blocked, "repeated wrong passwords are throttled");
  dbWrite("DELETE FROM rate_limits");
  check(errs.length === 0, `no page errors ${errs.join("|")}`);
  await finish(b);
})();
