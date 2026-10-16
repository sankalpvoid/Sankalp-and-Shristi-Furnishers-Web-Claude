// Browser checks for the pinned, scroll-scrubbed homepage sequence.
//   MAKING_SEQUENCE=1 npm run dev (or start)  then:  NODE_PATH=$(npm root -g) node e2e/making-sequence.cjs
// MODE=scrub (default): needs a browser that can decode the video (the CI chromium cannot decode H.264,
// so use MODE=fallback there to verify the failure path).
const { BASE, check, launch, finish } = require("./lib.cjs");
const MODE = process.env.MODE || "scrub";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(b, label, viewport, opts = {}) {
  console.log(`\n== ${label}`);
  const ctx = await b.newContext({ viewport, isMobile: viewport.width < 600, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  const sec = p.locator("section.mk-seq");
  check((await sec.count()) === 1, "sequence section is the first thing on the homepage");
  check(await p.evaluate(() => { const s = document.querySelector("section.mk-seq"); const h = document.querySelector(".header"); return s.getBoundingClientRect().top <= h.getBoundingClientRect().bottom + 2; }), "section sits directly under the header");
  const geom = () => p.evaluate(() => { const s = document.querySelector("section.mk-seq"), pin = document.querySelector(".mk-seq-pin"); const r = s.getBoundingClientRect(), pr = pin.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height, pinTop: pr.top, pinH: pr.height, vh: innerHeight, sy: scrollY }; });
  const g0 = await geom();

  if (opts.reduced) {
    check(await p.locator("video").count() === 0, "reduced motion: no video element");
    check(g0.h < g0.vh * 1.2, `reduced motion: not a tall pinned track (${Math.round(g0.h)}px)`);
    check(await p.locator('img.mk-seq-still[src*="final"]').count() === 1, "reduced motion: shows the finished frame");
    check(await p.locator("text=From frame to form").first().isVisible(), "reduced motion: closing caption + CTAs visible");
    check(errs.length === 0, `no page errors ${errs.join("|")}`);
    await ctx.close(); return;
  }

  const want = await p.evaluate((m) => parseFloat(getComputedStyle(document.querySelector("section.mk-seq")).getPropertyValue(m ? "--track-vh-m" : "--track-vh")) / 100, viewport.width <= 768);
  if (MODE !== "fallback" && (await p.locator("video").count())) check(Math.abs(g0.h - g0.vh * want) < 8, `track height is ${(g0.h / g0.vh).toFixed(2)} viewports (configured ${want})`);
  const total = g0.h - g0.pinH;
  const at = async (frac) => { await p.evaluate((y) => window.scrollTo(0, y), g0.top - 76 + total * frac); await sleep(900); };
  const state = () => p.evaluate(() => { const v = document.querySelector("video"); const g = document.querySelector("section.mk-seq-cap,.mk-seq-cap[data-on=true]"); return { t: v ? v.currentTime : null, d: v ? v.duration : null, failed: !v, cap: document.querySelector('.mk-seq-cap[data-on="true"] h2')?.textContent ?? null }; });

  await at(0.01); // load media
  await sleep(1500);
  let s = await state();

  if (MODE === "fallback" || s.failed) {
    check(s.failed, "video failed to decode → falls back (no video element)");
    check(await p.locator('img.mk-seq-still[src*="final"]').count() === 1, "fallback shows the finished frame");
    const g1 = await geom();
    check(g1.h < g1.vh * 1.2, "fallback collapses the pinned track so the page stays usable");
    check(await p.locator('a:has-text("Explore Furniture")').first().isVisible(), "CTAs remain reachable");
    check(errs.length === 0, `no page errors ${errs.join("|")}`);
    await ctx.close(); return;
  }

  check(s.d > 10 && s.d < 120, `video loaded (${s.d?.toFixed(1)} s)`);
  check(s.cap === "Crafted for Living", `opening caption visible (“${s.cap}”)`);
  const pin1 = await geom();
  check(Math.abs(pin1.pinTop - 76) < 3, `frame is pinned under the header (top=${Math.round(pin1.pinTop)})`);
  const times = {};
  for (const f of [0.25, 0.5, 0.75, 0.95]) { await at(f); s = await state(); times[f] = s.t; const want = f * s.d; check(Math.abs(s.t - want) < 0.5, `scroll ${f * 100}% → video ${s.t.toFixed(2)} s (expected ≈${want.toFixed(2)})`); }
  check(times[0.25] < times[0.5] && times[0.5] < times[0.75], "scrolling down advances the video");
  const pin2 = await geom();
  check(Math.abs(pin2.pinTop - 76) < 3, "still pinned late in the sequence");
  check((await state()).cap === "From frame to form", "closing caption visible near the end");
  await at(0.5); s = await state(); check(Math.abs(s.t - 0.5 * s.d) < 0.5, `scrolling back up rewinds the video (${s.t.toFixed(2)} s at 50%)`);
  await at(0.1); s = await state(); check(s.t < 0.2 * s.d, `rewinds to the start (${s.t.toFixed(2)} s)`);

  // release
  await p.evaluate((y) => window.scrollTo(0, y), g0.top + g0.h - g0.vh * 0.2); await sleep(700);
  const rel = await geom();
  check(rel.pinTop < 76 - 5, `pin releases at the end (frame scrolls away, top=${Math.round(rel.pinTop)})`);
  const after = await p.locator("#after-sequence").boundingBox();
  check(after && after.y < g0.vh, "the existing hero follows the sequence");
  await p.evaluate(() => document.querySelector("#after-sequence").scrollIntoView()); await sleep(300);
  check(await p.locator(".hero-copy h1").isVisible(), "existing homepage content is intact after the sequence");
  // navigation not trapped
  await p.evaluate(() => window.scrollTo(0, 0)); await sleep(500);
  check(await p.locator(".header").isVisible() && await p.locator(viewport.width < 1040 ? ".header .menu-btn" : ".header .nav").isVisible(), "header and navigation stay accessible while pinned");
  await p.locator('.mk-seq-cap[data-on="true"] a:has-text("Explore Furniture")').click(); await p.waitForURL("**/shop");
  check(p.url().endsWith("/shop"), "caption CTA navigates to the shop");
  check(errs.length === 0, `no page errors ${errs.join("|")}`);
  await ctx.close();
}

(async () => {
  const b = await launch();
  await run(b, `desktop (${MODE})`, { width: 1440, height: 900 });
  await run(b, `mobile (${MODE})`, { width: 390, height: 844 });
  await run(b, "reduced motion", { width: 1440, height: 900 }, { reduced: true });
  await finish(b);
})();
