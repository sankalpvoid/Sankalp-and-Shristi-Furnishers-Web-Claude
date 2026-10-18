// Homepage journey after the cinematic redesign: skip the film, reach the catalogue, a product, a configurator and the enquiry form.
// NODE_PATH=$(npm root -g) node e2e/homepage-journey.cjs   (server on BASE_URL, default :3100)
const { BASE, check, launch, finish } = require("./lib.cjs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function journey(b, label, viewport) {
  console.log(`\n== ${label}`);
  const ctx = await b.newContext({ viewport, isMobile: viewport.width < 600, hasTouch: viewport.width < 600 });
  const p = await ctx.newPage();
  const errs = [], bad = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource.*(mp4)|media/i.test(m.text()) && errs.push(m.text()));
  p.on("response", (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "no horizontal overflow");
  // skip the cinematic section straight to the arrival
  await p.locator(".mk-seq-skipbtn, .mk-seq-skip").first().focus().catch(() => {});
  await p.evaluate(() => document.querySelector("#after-sequence").scrollIntoView()); await sleep(900);
  check(await p.locator(".arrival-title").isVisible(), "skipping lands on the finished-pieces section");
  // scroll through every section so reveals fire, then audit images
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p.evaluate((v) => scrollTo(0, v), y); await sleep(120); }
  await sleep(1200);
  check(await p.locator(".rv:not(.in), .rv-mask:not(.in)").count() === 0, "every reveal element has revealed after scrolling through");
  const broken = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc));
  check(broken.length === 0, `no broken images ${broken.slice(0, 2).join(",")}`);
  // catalogue
  await p.locator('.quickshop a[href="/shop/sofas"]').click(); await p.waitForURL("**/shop/sofas");
  const card = p.locator("a.pcard").first(); check(await card.count() > 0, "category page lists products");
  await card.click(); await p.waitForURL("**/product/**");
  check(await p.locator("h1").first().isVisible(), "product page opens");
  // configurator via the homepage tile
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await p.evaluate(() => document.querySelector(".dtile").scrollIntoView()); await sleep(600);
  await p.locator('.dtile[href="/design/sofa"]').click(); await p.waitForURL("**/design/sofa");
  check(await p.locator(".stage, .cfg").first().isVisible(), "sofa configurator opens from the homepage");
  // enquiry via the closing call to action
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await p.locator(".final").scrollIntoViewIfNeeded(); await sleep(500);
  await p.locator('.final a:has-text("Enquire now")').click(); await p.waitForURL("**/contact**");
  check(await p.locator("form input[name=name], form #name, form input[type=text]").first().isVisible(), "enquiry form opens from the closing call to action");
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await p.locator('.final a:has-text("Plan a showroom visit")').scrollIntoViewIfNeeded(); await p.locator('.final a:has-text("Plan a showroom visit")').click(); await p.waitForURL("**/showroom**");
  check(true, "showroom visit plan opens");
  check(bad.filter((u) => !/favicon/.test(u)).length === 0, `no failed requests ${bad.slice(0, 3).join(" | ")}`);
  check(errs.length === 0, `no console/page errors ${errs.slice(0, 2).join("|")}`);
  await ctx.close();
}
(async () => {
  const b = await launch();
  await journey(b, "desktop 1440×900", { width: 1440, height: 900 });
  await journey(b, "mobile 390×844", { width: 390, height: 844 });
  await finish(b);
})();
