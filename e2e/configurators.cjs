const { BASE, check, launch, dbRows, adminLogin, pick, finish } = require("./lib.cjs");

const CASES = [
  { slug: "bed", conf: "bed", expect: { size: "custom", custom_length: 80, custom_width: 66, headboard: "arched", finish: "honey", storage: "drawers" },
    steps: async (p) => { await pick(p, "size", "custom"); await p.fill("#custom_length", "80"); await p.fill("#custom_width", "66"); await pick(p, "headboard", "arched"); await pick(p, "finish", "honey"); await pick(p, "storage", "drawers"); } },
  { slug: "sofa", conf: "sofa", expect: { layout: "five", fabric_type: "boucle", fabric: "terracotta", legs: "metal", finish: "walnut", cushions: "tufted" },
    steps: async (p) => { await pick(p, "layout", "five"); await pick(p, "fabric_type", "boucle"); await pick(p, "fabric", "terracotta"); await pick(p, "legs", "metal"); await pick(p, "finish", "walnut"); await pick(p, "cushions", "tufted"); } },
  { slug: "sofa-cum-bed", conf: "sofa_bed", expect: { layout: "two", mechanism: "foldout", sleeper: "double", fabric_type: "leatherette", fabric: "navy", finish: "ash", storage: "under" },
    steps: async (p) => { await pick(p, "layout", "two"); await pick(p, "mechanism", "foldout"); await pick(p, "sleeper", "double"); await pick(p, "fabric_type", "leatherette"); await pick(p, "fabric", "navy"); await pick(p, "finish", "ash"); await pick(p, "storage", "under"); await p.getByRole("button", { name: "Bed", exact: true }).click(); } },
  { slug: "dining", conf: "dining", expect: { shape: "oval", capacity: "8", finish: "espresso", chairs: "upholstered", chair_fabric: "sage" },
    steps: async (p) => { await pick(p, "shape", "oval"); await pick(p, "capacity", "8"); await pick(p, "finish", "espresso"); await pick(p, "chairs", "upholstered"); await pick(p, "chair_fabric", "sage"); } },
];
const PHONE = "9876501234", NAME = "Priya Sharma", NOTE_SECRET = "call me on 9000011111";

(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const results = [];

  for (const c of CASES) {
    console.log(`\n== ${c.slug}`);
    await page.goto(`${BASE}/design/${c.slug}`, { waitUntil: "networkidle" });
    await c.steps(page);
    await page.fill("#notes", NOTE_SECRET);
    const liveSummary = await page.locator(".cfg-sum li").allInnerTexts();
    await page.getByRole("button", { name: /Save design/ }).click();
    await page.waitForSelector("text=Design saved");
    const ref = (await page.locator(".ref-box code").innerText()).trim();
    check(new RegExp(`^SSFI-[A-Z]+-[A-Z2-9]{6}$`).test(ref), `reference format ${ref}`);
    const row = dbRows("SELECT * FROM configurations WHERE ref=?", ref)[0];
    check(row && row.configurator === c.conf, `stored as ${c.conf}`);
    const stored = JSON.parse(row.selections);
    const sameSel = JSON.stringify(Object.entries(stored).sort()) === JSON.stringify(Object.entries(c.expect).sort());
    check(sameSel, `stored selections match chosen options ${sameSel ? "" : JSON.stringify(stored)}`);
    const savedSummary = JSON.parse(row.summary).map((l) => `${l.label}\n${l.value}`.toLowerCase());
    check(liveSummary.length === savedSummary.length && liveSummary.every((t, i) => t.toLowerCase().replace(/\s+/g, " ") === savedSummary[i].replace(/\s+/g, " ")), "live summary equals saved summary");

    // Share link restores the design, in a brand-new anonymous browser context
    const anon = await b.newContext(); const ap = await anon.newPage();
    const resp = await ap.goto(`${BASE}/design/saved/${ref}`, { waitUntil: "networkidle" });
    check(resp.status() === 200, "share link opens for anonymous visitor");
    const shared = await ap.locator("dl.kv").innerText();
    check(JSON.parse(row.summary).every((l) => shared.includes(l.value)), "share page shows every saved option");
    const html = await ap.content();
    check(!html.includes(NOTE_SECRET) && !html.includes(PHONE) && !html.includes(NAME), "share page has no notes/contact details");
    // Edit from share link restores selections in the configurator
    await ap.goto(`${BASE}/design/${c.slug}?ref=${ref}`, { waitUntil: "networkidle" });
    let restored = true;
    for (const [k, v] of Object.entries(c.expect)) {
      if (k.startsWith("custom_")) { restored = restored && (await ap.inputValue(`#${k}`)) === String(v); }
      else restored = restored && (await ap.locator(`input[name=${k}][value="${v}"]`).isChecked());
    }
    check(restored, "configurator restores all options from ?ref=");
    await anon.close();

    // Enquiry linked to config, then ensure it still doesn't leak into the share page
    await page.goto(`${BASE}/contact?config=${ref}&intent=quote`, { waitUntil: "networkidle" });
    await page.fill("#name", NAME); await page.fill("#phone", PHONE);
    await page.getByRole("button", { name: /quotation/i }).click();
    await page.waitForSelector("text=Enquiry received");
    const enq = dbRows("SELECT * FROM enquiries WHERE config_ref=?", ref)[0];
    check(enq && enq.type === "configuration" && enq.intent === "quote", "enquiry saved and linked to configuration");
    const html2 = await (await ctx.request.get(`${BASE}/design/saved/${ref}`)).text();
    check(!html2.includes(PHONE) && !html2.includes(NAME), "share page still free of customer details after enquiry");
    results.push({ ref, c });
  }

  // Invalid combination handling
  console.log("\n== rules");
  await page.goto(`${BASE}/design/dining`, { waitUntil: "networkidle" });
  await pick(page, "capacity", "8"); await pick(page, "shape", "round");
  check(await page.locator('input[name=capacity][value="4"]').isChecked(), "round table auto-corrects 8 seats → 4");
  check(await page.locator('input[name=capacity][value="8"]').isDisabled(), "8 seats disabled for round table");
  const bad = await ctx.request.post(`${BASE}/api/configurations`, { data: { configurator: "dining", selections: { shape: "round", capacity: "8", finish: "natural", chairs: "none" } } });
  check(bad.status() === 400, "server rejects invalid combination");
  const bad2 = await ctx.request.post(`${BASE}/api/configurations`, { data: { configurator: "bed", selections: { size: "custom", headboard: "panel", finish: "natural", storage: "none", custom_length: 9999, custom_width: 5 } } });
  check(bad2.status() === 400, "server rejects out-of-range custom bed size");
  const bad3 = await ctx.request.post(`${BASE}/api/configurations`, { data: { configurator: "sofa", selections: { layout: "five", fabric_type: "velvet", fabric: "ivory", legs: "gold-plated", finish: "natural", cushions: "fixed" } } });
  check(bad3.status() === 400, "server rejects unknown option value");
  check((await ctx.request.get(`${BASE}/design/saved/SSFI-BED-ZZZZZZ`)).status() === 404, "unknown reference returns 404");

  // Admin retrieval
  console.log("\n== admin retrieval");
  await adminLogin(page);
  for (const { ref, c } of results) {
    await page.goto(`${BASE}/admin/configurations?ref=${ref}`, { waitUntil: "networkidle" });
    const t = await page.locator(".panel").first().innerText();
    const row = dbRows("SELECT summary, notes FROM configurations WHERE ref=?", ref)[0];
    check(JSON.parse(row.summary).every((l) => t.includes(l.value)) && t.includes(ref), `admin finds ${ref} with all options`);
    check(t.includes(NOTE_SECRET), `admin sees customer notes for ${c.slug}`);
    check(/#\d{4} Priya Sharma/.test(t), `admin shows linked enquiry for ${c.slug}`);
  }
  check(errs.length === 0, `no page errors ${errs.join("|")}`);
  await finish(b);
})();
