"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import trace from "./bed-trace.json";
import "./hero-lab.css";

/**
 * PROTOTYPE: "Elevation" hero. One scroll-progress value (0–1) drives everything.
 * The drawing is traced from mattes of the same 3D scene that produced the photograph, so line, mask and
 * image register exactly (see tools/render/trace-bed.py). Nothing here is autoplay except a ~1.4 s draw-on at
 * load; after that every visual is a pure function of scroll position, so it reverses exactly.
 */
type Group = { d: string; bbox: number[] }[];
const G = trace.groups as unknown as Record<string, Group>;
const SLATS = G.slat;
const LEVELS = G.roomLevels; // nested smooth contours around the object, see tools/render/trace-bed.py
const LV = (trace.groups as unknown as { roomLevelsMeta: { t0: number; ratio: number; n: number }[] }).roomLevelsMeta[0];
// Only the slats draw while the camera is close; the rest of the object is drawn once the view has pulled back.
const ORDER: [string, number, number][] = [["head", 0.34, 0.46], ["pillow", 0.4, 0.5], ["bedding", 0.44, 0.55], ["throw", 0.49, 0.57], ["frame", 0.5, 0.62]];
// Phones: the camera has the whole bed framed from p≈0.32, so the drawing grows leftward from the headboard inside a steady frame.
const ORDER_M: [string, number, number][] = [["head", 0.26, 0.38], ["pillow", 0.32, 0.42], ["bedding", 0.36, 0.48], ["throw", 0.42, 0.52], ["frame", 0.44, 0.58]];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const CFG = {
  // f→v: image point f is placed at stage point v; s is the zoom. Start = on the headboard slats, end = the whole plate.
  desktop: { par: "xMidYMid slice", S0: 5.2, f0: [955, 450], v0: [850, 590], s1: 1, f1: [750, 600], v1: [750, 600], sc1: 0.4, track: 340 },
  // Phones: a stacked composition that never swaps. The drawing / finished plate lives in the upper part of the stage and the
  // headline stays big below it (exactly as at the opening); only near the end does the headline rise to sit under the plate.
  // The headboard fits the width at first; the whole bed is framed by p=0.32 and stays centred between header and headline until
  // the reveal, when the camera rises to the final plate position.
  // keys: [p, zoom, fx, fy, vx, vy]   (screen y of an image point = oy + vy·scale, oy = letterbox offset)
  mobile: {
    par: "xMidYMid meet", S0: 7.6, f0: [900, 450], v0: [750, 560], s1: 1.2, f1: [716, 600], v1: [750, -158], sc1: 0.62, track: 290,
    keys: [[0, 7.6, 900, 450, 750, 560], [0.04, 7.6, 900, 450, 750, 560], [0.2, 2.5, 955, 470, 750, 50], [0.24, 2.5, 955, 470, 750, 50], [0.32, 1.2, 716, 600, 750, 50], [0.66, 1.2, 716, 600, 750, 50], [0.95, 1.2, 716, 600, 750, -158], [1, 1.2, 716, 600, 750, -158]] as number[][],
  },
};

/** Monotone cubic (Fritsch–Carlson) through (xs, ys): smooth, never overshoots, holds flat across equal keys. */
function pchip(xs: number[], ys: number[]) {
  const n = xs.length, h: number[] = [], d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; d[i] = (ys[i + 1] - ys[i]) / h[i]; }
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}
const MOBILE_CAM = (() => {
  const k = CFG.mobile.keys, xs = k.map((r) => r[0]);
  const f = [1, 2, 3, 4, 5].map((c) => pchip(xs, k.map((r) => (c === 1 ? Math.log(r[1]) : r[c]))));
  return (p: number) => ({ s: Math.exp(f[0](p)), fx: f[1](p), fy: f[2](p), vx: f[3](p), vy: f[4](p) });
})();

export type HeroCat = { slug: string; name: string };

export function HeroLab({ cats }: { cats: HeroCat[] }) {
  const root = useRef<HTMLElement>(null), pin = useRef<HTMLDivElement>(null), svg = useRef<SVGSVGElement>(null);
  const typeIn = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current, pinEl = pin.current, sv = svg.current, ti = typeIn.current;
    if (!el || !pinEl || !sv || !ti) return;
    const q = <T extends Element>(s: string) => Array.from(sv.querySelectorAll<T>(s));
    const cam = sv.querySelector<SVGGElement>("[data-cam]")!, lines = sv.querySelector<SVGGElement>("[data-lines]")!;
    const slatEls = q<SVGPathElement>("[data-slat]");
    const grpEls = Object.fromEntries(ORDER.map(([k]) => [k, q<SVGPathElement>(`[data-g="${k}"]`)]));
    const shadow = sv.querySelector<SVGElement>("[data-shadow]")!, levelEls = q<SVGPathElement>("[data-level]");
    const st1 = sv.querySelector<SVGStopElement>("[data-st1]")!, st2 = sv.querySelector<SVGStopElement>("[data-st2]")!;
    const light = pinEl.querySelector<HTMLElement>("[data-light]")!, fin = pinEl.querySelector<HTMLElement>("[data-final]")!;
    const cats_ = pinEl.querySelector<HTMLElement>("[data-cats]")!, cue = pinEl.querySelector<HTMLElement>("[data-cue]")!, tag = pinEl.querySelector<HTMLElement>("[data-tag]")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobMq = window.matchMedia("(max-width: 768px)");

    let p = 0, intro = 0, raf = 0, introRaf = 0, cfg: (typeof CFG)["desktop"] | (typeof CFG)["mobile"] = CFG.desktop, baseScale = 1, stageH = 800, blockH = 300, headerH = 76, introDone = false, measuredW = -1;
    const off = (e: SVGPathElement, r: number) => { e.style.strokeDashoffset = String(1 - clamp(r)); e.style.visibility = r <= 0.002 ? "hidden" : "visible"; };

    const render = () => {
      const stat = reduce.matches;
      const pp = stat ? 1 : p;
      const mob = mobMq.matches;
      // camera: dolly out from the headboard to the whole image (desktop: one eased move; phones: keyframes, see CFG)
      let s: number, fx: number, fy: number, vx: number, vy: number;
      if (mob) ({ s, fx, fy, vx, vy } = MOBILE_CAM(pp));
      else {
        const [fx0, fy0] = cfg.f0, [vx0, vy0] = cfg.v0, [fx1, fy1] = cfg.f1, [vx1, vy1] = cfg.v1;
        const t = ease(seg(pp, 0.04, 0.72));
        s = Math.pow(cfg.S0, 1 - t) * Math.pow(cfg.s1, t);
        fx = lerp(fx0, fx1, t); fy = lerp(fy0, fy1, t); vx = lerp(vx0, vx1, t); vy = lerp(vy0, vy1, t);
      }
      cam.setAttribute("transform", `translate(${vx.toFixed(2)} ${vy.toFixed(2)}) scale(${s.toFixed(4)}) translate(${-fx.toFixed(2)} ${-fy.toFixed(2)})`);
      lines.style.strokeWidth = String((1.15 / (baseScale * s)).toFixed(3));
      
      // drawing: slats on load; the rest as the camera pulls back
      const iv = stat ? 1 : intro;
      slatEls.forEach((e, i) => off(e, easeOut(clamp((iv - i * 0.018) / 0.62))));
      for (const [k, a, b] of mob ? ORDER_M : ORDER) grpEls[k].forEach((e, i) => off(e, ease(seg(pp, a + i * 0.01, b))));
      const fade = 1 - seg(pp, 0.62, 0.78);
      lines.style.opacity = (stat ? 0 : fade).toFixed(3);
      // emergence: the object appears inside its own silhouette, top to bottom, following the drawing
      const Y = lerp(290, 1060, ease(seg(pp, 0.5, 0.7)));
      st1.setAttribute("offset", clamp((Y - 90) / 1200).toFixed(4)); st2.setAttribute("offset", clamp(Y / 1200).toFixed(4));
      if (pp <= 0.5) { st1.setAttribute("offset", "0"); st2.setAttribute("offset", "0.001"); }
      // then the room: it grows outward from the object's own silhouette as nested smooth contours (wall above and floor below
      // arrive together; no straight or arched edge ever crosses the frame). We crossfade between adjacent contour levels.
      const g = easeOut(seg(pp, 0.66, 0.78)) * 0.3 + Math.pow(seg(pp, 0.74, 0.95), 1.4) * 0.7;
      const kf = pp < 0.66 ? -1 : g * (LV.n - 1);
      const k0 = Math.floor(kf);
      levelEls.forEach((e, k) => {
        const o = k < k0 ? 1 : k === k0 ? 1 : k === k0 + 1 ? kf - k0 : 0;
        e.style.opacity = o.toFixed(3); e.style.display = o <= 0.002 ? "none" : "";
      });
      // type: huge → resolved at top left
      // desktop: the headline climbs to the top-left early. phones: it stays low until the plate is revealed, then rises under it.
      const tt = mob ? ease(seg(pp, 0.6, 0.84)) : ease(seg(pp, 0.08, 0.52));
      const sc = lerp(1, cfg.sc1, tt);
      const plateB = ((stageH - 1200 * baseScale) / 2) + (cfg.v1[1] + (1200 - cfg.f1[1]) * cfg.s1) * baseScale;
      const pad0 = mob ? 96 : stageH * 0.075, pad1 = mob ? plateB + 16 : stageH * 0.085;
      const ty = lerp(stageH - blockH - pad0, pad1, tt);
      ti.style.setProperty("--sc", sc.toFixed(4));
      ti.style.transform = `translate3d(0,${ty.toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
      // light sweeping across the paper, then gone
      light.style.transform = `translate3d(${lerp(-40, 120, seg(pp, 0, 0.62)).toFixed(1)}%,0,0)`;
      light.style.opacity = (0.9 * (1 - seg(pp, 0.5, 0.66))).toFixed(3);
      cue.style.opacity = (1 - seg(pp, 0.0, 0.05)).toFixed(3);
      const f = seg(pp, 0.86, 0.96);
      fin.style.opacity = f.toFixed(3); fin.style.transform = `translate3d(0,${((1 - f) * 18).toFixed(1)}px,0)`; fin.style.pointerEvents = f > 0.6 ? "auto" : "none";
      cats_.style.opacity = seg(pp, 0.92, 1).toFixed(3); cats_.style.pointerEvents = pp > 0.95 ? "auto" : "none";
      if (mob) { // phones: pin the tag to the plate's bottom edge
        const oy = (stageH - 1200 * baseScale) / 2;
        tag.style.top = `${(((1200 - cfg.f1[1]) * cfg.s1 + cfg.v1[1]) * baseScale + oy - 26).toFixed(0)}px`;
      } else tag.style.top = "";
      tag.style.opacity = seg(pp, 0.84, 0.94).toFixed(3);
      shadow.style.opacity = (ease(seg(pp, 0.5, 0.66)) * (1 - seg(pp, 0.7, 0.84))).toFixed(3);
      fin.toggleAttribute("inert", f < 0.6); cats_.toggleAttribute("inert", pp <= 0.95 && !stat);
    };

    const measure = () => {
      cfg = mobMq.matches ? CFG.mobile : CFG.desktop;
      sv.setAttribute("preserveAspectRatio", cfg.par);
      const r = sv.getBoundingClientRect();
      baseScale = cfg.par.includes("slice") ? Math.max(r.width / 1500, r.height / 1200) : Math.min(r.width / 1500, r.height / 1200);
      stageH = pinEl.clientHeight;
      // Measure the headline at unit scale: its eyebrow is counter-scaled (and can re-wrap), so reading the height at the
      // current scale would feed the previous frame back into this one and make the position path-dependent.
      if (measuredW !== window.innerWidth) { ti.style.setProperty("--sc", "1"); blockH = ti.offsetHeight; measuredW = window.innerWidth; }
      headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 76;
      el.style.setProperty("--hl-track", String(reduce.matches ? 0 : cfg.track));
      const rect = el.getBoundingClientRect();
      const total = Math.max(1, rect.height - pinEl.offsetHeight);
      p = reduce.matches ? 1 : clamp((headerH - rect.top) / total);
    };
    const loop = () => { raf = 0; measure(); render(); };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    // ~1.4 s draw-on at load (skipped when the page opens mid-scroll or with reduced motion)
    measure();
    if (reduce.matches || p > 0.02) { intro = 1; introDone = true; }
    render();
    if (!introDone) {
      const t0 = performance.now();
      const step = (now: number) => {
        intro = clamp((now - t0) / 1500);
        render();
        introRaf = intro < 1 ? requestAnimationFrame(step) : 0;
      };
      introRaf = requestAnimationFrame(step);
    }
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    reduce.addEventListener("change", kick); mobMq.addEventListener("change", kick);
    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(introRaf);
      window.removeEventListener("scroll", kick); window.removeEventListener("resize", kick);
      reduce.removeEventListener("change", kick); mobMq.removeEventListener("change", kick);
    };
  }, []);

  return (
    <>
      <section ref={root} className="hl" aria-label="Crafted for Living: an introduction drawn from a bed's own structure">
        <noscript>
          {/* Without JavaScript the drawing never runs: show the finished composition instead. */}
          <style>{`.hl{height:auto!important}.hl-pin{position:relative!important;top:0!important;height:min(calc(100svh - var(--header-h)),860px)!important}.hl-svg,.hl-skipbtn,.hl-cue,.hl-light{display:none!important}.hl-final,.hl-cats,.hl-tag{opacity:1!important;pointer-events:auto!important}.hl-nojs{display:block!important}.hl-type-in{transform:translateY(5vh) scale(.4)!important}`}</style>
        </noscript>
        <a className="hl-skip" href="#hl-after">Skip to furniture</a>
        <div className="hl-pin" ref={pin}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hl-nojs" src="/renders/products/slatted-headboard-bed.webp" alt="" />
          <svg ref={svg} className="hl-svg" viewBox="0 0 1500 1200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <defs>
              {/* The silhouette is uncovered top to bottom by sliding a black gradient down over the matte (no nested masks). */}
              <linearGradient id="hl-cover" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1200">
                <stop offset="0" stopColor="#000" stopOpacity="0" /><stop data-st1="" offset="0" stopColor="#000" stopOpacity="0" /><stop data-st2="" offset="0.001" stopColor="#000" stopOpacity="1" /><stop offset="1" stopColor="#000" stopOpacity="1" />
              </linearGradient>
              <mask id="hl-room" maskUnits="userSpaceOnUse" x="-800" y="-900" width="3100" height="2800">
                <rect x="-800" y="-900" width="3100" height="2800" fill="#000" />
                {LEVELS.map((l, k) => <path key={k} data-level="" d={l.d} fill="#fff" fillRule="evenodd" style={{ display: "none" }} />)}
              </mask>
              <mask id="hl-obj" maskUnits="userSpaceOnUse" x="-800" y="-900" width="3100" height="2800">
                <rect x="-800" y="-900" width="3100" height="2800" fill="#000" />
                <image href="/lab/bed-matte.png" width="1500" height="1200" />
                <rect width="1500" height="1200" fill="url(#hl-cover)" />
              </mask>
              <radialGradient id="hl-sh"><stop offset="0" stopColor="#3c2814" stopOpacity=".38" /><stop offset=".6" stopColor="#3c2814" stopOpacity=".12" /><stop offset="1" stopColor="#3c2814" stopOpacity="0" /></radialGradient>
              <clipPath id="hl-head-clip"><path d={G.head[0].d} /></clipPath>
            </defs>
            <g data-cam="">
              <ellipse data-shadow="" cx="690" cy="915" rx="560" ry="74" fill="url(#hl-sh)" opacity="0" />
              <image href="/renders/products/slatted-headboard-bed.webp" width="1500" height="1200" mask="url(#hl-room)" />
              <image href="/renders/products/slatted-headboard-bed.webp" width="1500" height="1200" mask="url(#hl-obj)" />
              <g data-lines="" className="hl-lines">
                <g clipPath="url(#hl-head-clip)">
                  {SLATS.map((s, i) => <path key={i} data-slat="" d={s.d} pathLength={1} />)}
                </g>
                {ORDER.map(([k]) => G[k].map((s, i) => <path key={k + i} data-g={k} d={s.d} pathLength={1} />))}
              </g>
            </g>
          </svg>
          <div className="hl-light" data-light="" aria-hidden="true" />
          <div className="hl-type">
            <div className="hl-type-in" ref={typeIn}>
              <span className="hl-eyebrow">Sankalp &amp; Shristi Furnishers</span>
              <h1 className="hl-h1"><span className="ln"><span>Crafted</span></span><span className="ln"><span>for Living</span></span></h1>
            </div>
          </div>
          <a className="hl-skipbtn" href="#hl-after">Skip to furniture <span aria-hidden>↓</span></a>
          <div className="hl-cue" data-cue="" aria-hidden="true"><i /><span>Scroll</span></div>
          <div className="hl-final" data-final="">
            <p className="hl-caption"><Link href="/product/slatted-headboard-bed">Slatted Headboard Bed</Link></p>
            <div className="row">
              <Link className="btn" href="/shop">Explore Furniture</Link>
              <Link className="btn ghost" href="/design/bed">Design Your Own</Link>
              <Link className="btn ghost" href="/contact">Enquire</Link>
            </div>
          </div>
          <nav className="hl-cats" data-cats="" aria-label="Furniture categories">
            {cats.map((c) => <Link key={c.slug} href={`/shop/${c.slug}`}>{c.name}</Link>)}
          </nav>
          <span className="hl-tag" data-tag="">Placeholder studio render · not real photography</span>
        </div>
      </section>
      <div id="hl-after" tabIndex={-1} />
    </>
  );
}
