const { BASE, check, launch, dbRows, adminLogin, finish } = require("./lib.cjs");
const PUBLIC = ["/", "/showroom", "/shop", "/shop/beds", "/product/three-seater-sofa", "/product/slatted-headboard-bed", "/making", "/contact", "/design/bed"];
(async () => {
  const b = await launch();
  const admin = await (await b.newContext()).newPage();
  await adminLogin(admin);
  const anon = await (await b.newContext()).newPage();
  const scan = async () => { const out = {}; for (const p of PUBLIC) { await anon.goto(BASE + p, { waitUntil: "networkidle" }); const t = (await anon.content()).toLowerCase(); out[p] = { ring: t.includes("ring road") || t.includes("oldest furniture"), guar: t.includes("guarantee") }; } return out; };
  const setFlags = async (legacy, guar) => {
    await admin.goto(BASE + "/admin/settings", { waitUntil: "networkidle" });
    await admin.setChecked('input[name="flags.legacyClaimVerified"]', legacy); await admin.setChecked('input[name="flags.guaranteeVerified"]', guar);
    await Promise.all([admin.waitForResponse((r) => r.request().method() === "POST"), admin.click("button:has-text('Save all settings')")]); await admin.waitForSelector("text=Settings saved.");
  };
  // put a product-level guarantee in place so we can check product pages too
  await admin.goto(BASE + "/admin/products?q=Three-Seater"); await admin.click("a:has-text('Three-Seater Sofa')");
  await admin.fill("#warranty_text", "Draft guarantee wording"); await Promise.all([admin.waitForResponse((r) => r.request().method() === "POST"), admin.click("button:has-text('Save changes')")]); await admin.waitForSelector("text=Saved.");

  await setFlags(false, false);
  let r = await scan();
  check(PUBLIC.every((p) => !r[p].ring), "unverified: 'Ring Road / oldest' appears on NO public page");
  check(PUBLIC.every((p) => !r[p].guar), "unverified: 'guarantee' appears on NO public page (incl. product pages)");
  await admin.goto(BASE + "/admin/settings");
  check((await admin.inputValue('textarea[name="story.legacyClaim"]')).includes("Ring Road"), "claim preserved as editable draft in admin");
  check((await admin.inputValue('input[name="story.guaranteeHeadline"]')).length > 0, "guarantee wording preserved as editable draft in admin");
  await admin.goto(BASE + "/admin"); check((await admin.locator("text=HIDDEN from the public site").count()) === 2, "dashboard flags both claims as hidden");

  await setFlags(true, true);
  r = await scan();
  check(r["/"].ring && r["/showroom"].ring, "legacy claim shows after owner verifies it");
  check(r["/"].guar && r["/product/three-seater-sofa"].guar, "guarantee shows after owner verifies it");
  await setFlags(false, false);
  r = await scan();
  check(PUBLIC.every((p) => !r[p].ring && !r[p].guar), "re-hidden when verification is removed");
  check(dbRows("SELECT value FROM settings WHERE key='site'").length === 1, "settings persisted in database");
  await finish(b);
})();
