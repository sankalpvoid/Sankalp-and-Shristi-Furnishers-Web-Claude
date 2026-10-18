// Browser checks for the /lab/hero prototype. NODE_PATH=$(npm root -g) node e2e/hero-lab.cjs  (server on BASE_URL, default :3100)
const { BASE, check, launch, finish } = require("./lib.cjs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = BASE + "/lab/hero";

async function setup(b, viewport, opts = {}) {
  const ctx = await b.newContext({ viewport, isMobile: viewport.width < 600, hasTouch: viewport.width < 600, reducedMotion: opts.reduced ? "reduce" : "no-preference", javaScriptEnabled: !opts.noJs });
  const p = await ctx.newPage();
  const errs = [], bad = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  p.on("response", (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await p.goto(URL, { waitUntil: "networkidle" });
  await sleep(opts.noJs ? 200 : 1900); // let the ~1.4 s draw-on at load finish
  return { ctx, p, errs, bad };
}
const geom = (p) => p.evaluate(() => { const s = document.querySelector(".hl"), pin = document.querySelector(".hl-pin"); const r = s.getBoundingClientRect(), pr = pin.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height, pinH: pr.height, pinTop: pr.top, vh: innerHeight, hh: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 76 }; });
const goto = async (p, g, f) => { await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), g.top - g.hh + (g.h - g.pinH) * f); await sleep(250); };
const sig = (p) => p.evaluate(() => JSON.stringify([document.querySelector("[data-cam]").getAttribute("transform"), [...document.querySelectorAll("[data-level]")].map((e) => e.style.opacity + e.style.display).join(","), document.querySelector("[data-final]").style.opacity, document.querySelector("[data-st1]").getAttribute("offset"), document.querySelector(".hl-type-in").style.transform, [...document.querySelectorAll("[data-g]")].map((e) => e.style.strokeDashoffset).join(",")]));
const camScale = (p) => p.evaluate(() => parseFloat(/scale\(([\d.]+)\)/.exec(document.querySelector("[data-cam]").getAttribute("transform"))[1]));

async function run(b, label, viewport) {
  console.log(`\n== ${label}`);
  const { ctx, p, errs, bad } = await setup(b, viewport);
  const g = await geom(p);
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "no horizontal overflow at load");
  check(await p.locator("h1").count() === 1 && await p.locator("h1").isVisible(), "one visible h1 (\"Crafted for Living\")");
  const want = viewport.width <= 768 ? 2.9 : 3.4;
  check(Math.abs(g.h / g.vh - want) < 0.15, `track is ${(g.h / g.vh).toFixed(2)} screens (intended ≈${want})`);
  check(await p.evaluate(() => [...document.querySelectorAll("[data-slat]")].every((e) => parseFloat(e.style.strokeDashoffset) < 0.05)), "opening: slat drawing has completed after the load draw-on");

  await goto(p, g, 0.02); let pin = await geom(p);
  check(Math.abs(pin.pinTop - g.hh) < 3, `pinned under the header at the start (top=${Math.round(pin.pinTop)})`);
  await goto(p, g, 0.95); pin = await geom(p);
  check(Math.abs(pin.pinTop - g.hh) < 3, "still pinned at the end of the sequence");
  // monotonic camera pull-back
  const scales = []; for (const f of [0, 0.15, 0.3, 0.45, 0.6, 0.72]) { await goto(p, g, f); scales.push(await camScale(p)); }
  check(scales.every((s, i) => i === 0 || s <= scales[i - 1] + 0.001) && scales[0] > scales[scales.length - 1] * 3, `camera pulls back (never pushes in; holds are allowed) (${scales.map((s) => s.toFixed(2)).join(" → ")})`);
  // reversibility: the same scroll position always gives the same picture, whichever way you arrived
  const states = {};
  for (const f of [0.3, 0.6, 0.68, 0.72, 0.8, 0.9]) { await goto(p, g, f); states[f] = await sig(p); }
  let same = true;
  for (const f of [0.8, 0.68, 0.9, 0.3, 0.72, 0.6, 0.9, 0.68]) { await goto(p, g, f); if ((await sig(p)) !== states[f]) same = false; }
  check(same, "scrolling backwards reproduces the exact same state at 30 / 60 / 68 / 72 / 80 / 90 %");
  // the room grows monotonically from the object (no jumps, no shrinking), forwards and back
  const cover = () => p.evaluate(() => [...document.querySelectorAll("[data-level]")].reduce((a, e) => a + (e.style.display === "none" ? 0 : parseFloat(e.style.opacity)), 0));
  const covF = []; for (let f = 0.6; f <= 0.961; f += 0.02) { await goto(p, g, f); covF.push(await cover()); }
  check(covF.every((c, i) => i === 0 || c >= covF[i - 1] - 0.001), `room reveal grows monotonically (${covF.map((c) => c.toFixed(0)).join(" ")})`);
  const stepMax = Math.max(...covF.map((c, i) => (i ? c - covF[i - 1] : 0)));
  check(stepMax < 14, `no jump in the room reveal between 2 % steps (largest ${stepMax.toFixed(1)} of 60 levels)`);
  await goto(p, g, 0.67); const c67 = await cover(); await goto(p, g, 0.72); const c72 = await cover();
  check(c67 < 15 && c72 > c67, `at 67 % the room has barely begun (${c67.toFixed(1)}) and keeps growing by 72 % (${c72.toFixed(1)})`);
  await goto(p, g, 0.5); const mid = await sig(p); await goto(p, g, 0.0); await goto(p, g, 0.5);
  check((await sig(p)) === mid, "returning from the very top reproduces the 50 % state");
  if (viewport.width <= 768) {
    // phones: the drawing stays inside the width, and the lower half stays occupied by the headline (no void)
    const box = () => p.evaluate(() => { const gs = [...document.querySelectorAll("[data-g]")].filter((e) => e.style.visibility !== "hidden").map((e) => e.getBoundingClientRect()); const sl = [...document.querySelectorAll("[data-slat]")].filter((e) => e.style.visibility !== "hidden").length; if (!gs.length) return null; const l = Math.min(...gs.map((r) => r.left)), r = Math.max(...gs.map((r) => r.right)), t = Math.min(...gs.map((r) => r.top)), b = Math.max(...gs.map((r) => r.bottom)); const pin = document.querySelector(".hl-pin").getBoundingClientRect(); const ty = document.querySelector(".hl-type-in").getBoundingClientRect(); return { l, r, t, b, pinTop: pin.top, pinH: pin.height, typeTop: ty.top, vw: innerWidth, sl }; });
    let ok = true, why = "";
    for (const f of [0.3, 0.34, 0.38, 0.42, 0.46, 0.5, 0.55, 0.6]) { await goto(p, g, f); const bx = await box(); if (bx && (bx.l < -1 || bx.r > bx.vw + 1)) { ok = false; why += ` ${f}:[${Math.round(bx.l)},${Math.round(bx.r)}]`; } }
    check(ok, `drawing is never cropped by the screen edge between 30 % and 60 %${why}`);
    ok = true; why = "";
    for (const f of [0.4, 0.45, 0.5, 0.55]) { await goto(p, g, f); const bx = await box(); const lowerThird = bx.pinTop + bx.pinH * 0.72; if (!(bx.typeTop < lowerThird)) { ok = false; why += ` ${f}`; } if (bx.b > bx.typeTop - 8) { ok = false; why += ` overlap@${f}`; } }
    check(ok, `40–55 %: the headline occupies the lower part and does not overlap the drawing${why}`);
    await goto(p, g, 0.5); const mid = await box();
    check(mid.t - mid.pinTop > 40 && (mid.pinTop + mid.pinH) - mid.b > 150, `50 %: drawing sits clear of the stage edges (top gap ${Math.round(mid.t - mid.pinTop)} px, bottom gap ${Math.round(mid.pinTop + mid.pinH - mid.b)} px)`);
  }
  // end state & links
  await goto(p, g, 1);
  check(await p.evaluate(() => getComputedStyle(document.querySelector("[data-final]")).opacity) === "1", "final frame: actions fully visible");
  check(await p.locator('.hl-final a:has-text("Explore Furniture")').isVisible() && await p.locator('.hl-final a:has-text("Design Your Own")').count() === 1 && await p.locator('.hl-final a:has-text("Enquire")').count() === 1, "final frame offers Explore / Design / Enquire");
  check(await p.locator(".hl-cats a").count() === 6, "final frame lists the six categories");
  check(await p.locator(".hl-tag").isVisible(), "placeholder disclosure is visible at the end");
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "no horizontal overflow at the end");
  // release into the catalogue
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), g.top + g.h - g.vh * 0.3); await sleep(900);
  pin = await geom(p);
  check(pin.pinTop < g.hh - 5, `pin releases naturally (top=${Math.round(pin.pinTop)})`);
  check(await p.locator("#collections").isVisible(), "the real catalogue collections follow the hero");
  // skip from inside the sequence
  await goto(p, g, 0.3);
  await p.locator(".hl-skipbtn").click(); await sleep(1500);
  const col = await p.locator("#collections").boundingBox();
  check(col && col.y < g.vh * 0.9 && col.y > -g.vh, `Skip to furniture lands at the catalogue (collections top=${Math.round(col?.y ?? 9999)})`);
  // keyboard: first Tab reveals the skip link
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await sleep(300);
  await p.locator(".hl-skip").focus(); await sleep(150);
  const sk = await p.locator(".hl-skip").boundingBox();
  check(sk && sk.y >= 0 && sk.y < 200, "the keyboard skip link becomes visible on focus");
  await p.keyboard.press("Enter"); await sleep(1200);
  check((await p.locator("#collections").boundingBox()).y < g.vh, "Enter on the skip link jumps to the catalogue");
  // resize while mid-sequence
  await goto(p, g, 0.5);
  await p.setViewportSize({ width: viewport.width < 600 ? 800 : 900, height: viewport.height }); await sleep(500);
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "resize: no horizontal overflow");
  await p.setViewportSize(viewport); await sleep(500);
  const g2 = await geom(p); await goto(p, g2, 0.6);
  check((await sig(p)).length > 20, "resize: composition recomputes without errors");
  check(bad.filter((u) => !/favicon/.test(u)).length === 0, `no failed requests ${bad.slice(0, 2).join(" | ")}`);
  check(errs.length === 0, `no console/page errors ${errs.slice(0, 2).join("|")}`);
  await ctx.close();
}

async function links(b) {
  console.log("\n== links from the final frame (desktop)");
  const { ctx, p } = await setup(b, { width: 1440, height: 900 });
  let g = await geom(p); await goto(p, g, 1);
  await p.locator('.hl-final a:has-text("Explore Furniture")').click(); await p.waitForURL("**/shop"); check(p.url().endsWith("/shop"), "Explore Furniture → /shop");
  await p.goto(URL, { waitUntil: "networkidle" }); await sleep(1200); g = await geom(p); await goto(p, g, 1);
  await p.locator('.hl-cats a[href="/shop/beds"]').click(); await p.waitForURL("**/shop/beds"); check(p.url().endsWith("/shop/beds"), "category link → /shop/beds");
  await p.goto(URL, { waitUntil: "networkidle" }); await sleep(1200); g = await geom(p); await goto(p, g, 1);
  await p.locator('.hl-final a:has-text("Design Your Own")').click(); await p.waitForURL("**/design/bed"); check(p.url().endsWith("/design/bed"), "Design Your Own → /design/bed");
  await p.goto(URL, { waitUntil: "networkidle" }); await sleep(1200); g = await geom(p); await goto(p, g, 1);
  await p.locator('.hl-caption a').click(); await p.waitForURL("**/product/slatted-headboard-bed"); check(await p.locator("h1").first().isVisible(), "caption → the bed's product page");
  await ctx.close();
}

async function fallbacks(b) {
  for (const [label, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    console.log(`\n== reduced motion (${label})`);
    const { ctx, p, errs } = await setup(b, vp, { reduced: true });
    const g = await geom(p);
    check(g.h <= g.vh + 4, `not a tall pinned track (${Math.round(g.h)}px)`);
    check(await p.locator("h1").isVisible(), "headline visible");
    check(await p.evaluate(() => getComputedStyle(document.querySelector("[data-final]")).opacity) === "1", "actions visible");
    check(await p.locator(".hl-cats a").first().isVisible(), "categories visible");
    check(await p.evaluate(() => { const l = [...document.querySelectorAll("[data-level]")].pop(); return l.style.display !== "none" && l.style.opacity === "1"; }), "photograph fully revealed (final room level open)");
    check(await p.evaluate(() => parseFloat(document.querySelector("[data-lines]").style.opacity) === 0), "no drawing overlay left on the photograph");
    check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "no horizontal overflow");
    check(errs.length === 0, `no errors ${errs.join("|")}`);
    await ctx.close();
  }
  console.log("\n== JavaScript disabled");
  const { ctx, p } = await setup(b, { width: 1440, height: 900 }, { noJs: true });
  const g = await geom(p);
  check(g.h <= g.vh + 4, "no tall track without JS");
  check(await p.locator(".hl-nojs").isVisible(), "static photograph is shown");
  check(await p.locator('.hl-final a:has-text("Explore Furniture")').isVisible(), "actions reachable without JS");
  await ctx.close();
}

(async () => {
  const b = await launch();
  await run(b, "desktop 1440×900", { width: 1440, height: 900 });
  await run(b, "mobile 390×844", { width: 390, height: 844 });
  await links(b);
  await fallbacks(b);
  await finish(b);
})();
