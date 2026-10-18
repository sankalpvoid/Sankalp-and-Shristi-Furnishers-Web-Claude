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
// Only the slats draw while the camera is close; the rest of the object is drawn once the view has pulled back.
const ORDER: [string, number, number][] = [["head", 0.34, 0.46], ["pillow", 0.4, 0.5], ["bedding", 0.44, 0.55], ["throw", 0.49, 0.57], ["frame", 0.5, 0.62]];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const CFG = {
  // f→v: image point f is placed at stage point v; s is the zoom. Start = on the headboard slats, end = the whole plate.
  desktop: { par: "xMidYMid slice", S0: 5.2, f0: [955, 450], v0: [850, 590], s1: 1, f1: [750, 600], v1: [750, 600], sc1: 0.4, posEnd: 0.72, track: 340 },
  mobile: { par: "xMidYMid meet", S0: 7.6, f0: [900, 450], v0: [750, 600], s1: 1.2, f1: [716, 600], v1: [750, 372], sc1: 0.62, posEnd: 0.5, track: 290 },
};

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
    const shadow = sv.querySelector<SVGElement>("[data-shadow]")!, archMask = sv.querySelector<SVGPathElement>("[data-arch]")!, archEdge = sv.querySelector<SVGPathElement>("[data-arch-edge]")!;
    const st1 = sv.querySelector<SVGStopElement>("[data-st1]")!, st2 = sv.querySelector<SVGStopElement>("[data-st2]")!;
    const light = pinEl.querySelector<HTMLElement>("[data-light]")!, fin = pinEl.querySelector<HTMLElement>("[data-final]")!;
    const cats_ = pinEl.querySelector<HTMLElement>("[data-cats]")!, cue = pinEl.querySelector<HTMLElement>("[data-cue]")!, tag = pinEl.querySelector<HTMLElement>("[data-tag]")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobMq = window.matchMedia("(max-width: 768px)");

    let p = 0, intro = 0, raf = 0, introRaf = 0, cfg = CFG.desktop, baseScale = 1, stageH = 800, blockH = 300, headerH = 76, introDone = false;
    const off = (e: SVGPathElement, r: number) => { e.style.strokeDashoffset = String(1 - clamp(r)); e.style.visibility = r <= 0.002 ? "hidden" : "visible"; };

    const render = () => {
      const stat = reduce.matches;
      const pp = stat ? 1 : p;
      const mob = mobMq.matches;
      const [fx0, fy0] = cfg.f0, [vx0, vy0] = cfg.v0, [fx1, fy1] = cfg.f1, [vx1, vy1] = cfg.v1;
      // camera: dolly out from the headboard to the whole image
      const t = ease(seg(pp, 0.04, 0.72));
      const s = Math.pow(cfg.S0, 1 - t) * Math.pow(cfg.s1, t);
      const tp = ease(seg(pp, 0.04, cfg.posEnd)); // position can settle before the zoom does (phones centre the object sooner)
      const fx = lerp(fx0, fx1, tp), fy = lerp(fy0, fy1, tp), vx = lerp(vx0, vx1, tp), vy = lerp(vy0, vy1, tp);
      cam.setAttribute("transform", `translate(${vx.toFixed(2)} ${vy.toFixed(2)}) scale(${s.toFixed(4)}) translate(${-fx.toFixed(2)} ${-fy.toFixed(2)})`);
      lines.style.strokeWidth = String((1.15 / (baseScale * s)).toFixed(3));
      archEdge.style.strokeWidth = String((1.5 / (baseScale * s)).toFixed(3));
      // drawing: slats on load; the rest as the camera pulls back
      const iv = stat ? 1 : intro;
      slatEls.forEach((e, i) => off(e, easeOut(clamp((iv - i * 0.018) / 0.62))));
      for (const [k, a, b] of ORDER) grpEls[k].forEach((e, i) => off(e, ease(seg(pp, a + i * 0.01, b))));
      const fade = 1 - seg(pp, 0.62, 0.78);
      lines.style.opacity = (stat ? 0 : fade).toFixed(3);
      // emergence: the object appears inside its own silhouette, top to bottom, following the drawing
      const Y = lerp(290, 1060, ease(seg(pp, 0.5, 0.7)));
      st1.setAttribute("offset", clamp((Y - 90) / 1200).toFixed(4)); st2.setAttribute("offset", clamp(Y / 1200).toFixed(4));
      if (pp <= 0.5) { st1.setAttribute("offset", "0"); st2.setAttribute("offset", "0.001"); }
      // then its architecture: an arch opens behind it and widens to the whole frame
      // phase 1: an arch opens sideways behind the bed (crown fixed). phase 2: it widens past the frame.
      const r1 = easeOut(seg(pp, 0.64, 0.76)), r2 = Math.pow(seg(pp, 0.78, 0.95), 1.7);
      const R = r2 > 0 ? lerp(560, 2300, r2) : 14 + r1 * 546;
      const ys = r2 > 0 ? lerp(810, 300, r2) : 250 + R; // springline: crown stays at y=250 while it opens
      const base = lerp(985, 1560, r2);
      const d = pp >= 0.64 ? `M${716 - R} ${base}L${716 - R} ${ys}A${R} ${R} 0 0 1 ${716 + R} ${ys}L${716 + R} ${base}Z` : "";
      archMask.setAttribute("d", d); archEdge.setAttribute("d", d);
      archEdge.style.opacity = (d ? 1 - seg(pp, 0.88, 0.96) : 0).toFixed(3);
      // type: huge → resolved at top left
      const tt = ease(seg(pp, 0.08, 0.52));
      const sc = lerp(1, cfg.sc1, tt);
      const pad0 = mob ? 96 : stageH * 0.075, pad1 = mob ? 18 : stageH * 0.085;
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
        tag.style.top = `${(((1200 - fy1) * cfg.s1 + vy1) * baseScale + oy - 26).toFixed(0)}px`;
      } else tag.style.top = "";
      tag.style.opacity = seg(pp, 0.84, 0.94).toFixed(3);
      shadow.style.opacity = (ease(seg(pp, 0.5, 0.66)) * (1 - seg(pp, 0.7, 0.8))).toFixed(3);
      fin.toggleAttribute("inert", f < 0.6); cats_.toggleAttribute("inert", pp <= 0.95 && !stat);
    };

    const measure = () => {
      cfg = mobMq.matches ? CFG.mobile : CFG.desktop;
      sv.setAttribute("preserveAspectRatio", cfg.par);
      const r = sv.getBoundingClientRect();
      baseScale = cfg.par.includes("slice") ? Math.max(r.width / 1500, r.height / 1200) : Math.min(r.width / 1500, r.height / 1200);
      stageH = pinEl.clientHeight; blockH = ti.offsetHeight;
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
                <path data-arch="" fill="#fff" d="" />
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
              <path data-arch-edge="" className="hl-arch-edge" d="" fill="none" />
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
