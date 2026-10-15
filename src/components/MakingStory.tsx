"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Art } from "./art";
import { MakingArt } from "./art/making";
import type { MakingStage } from "@/lib/site-defaults";
import type { RenderImg } from "@/lib/renders";

export interface StageView extends MakingStage { render: RenderImg | null }

function Visual({ st, uid }: { st: StageView; uid: string }) {
  if (st.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={st.image} alt={st.title} loading="lazy" decoding="async" />;
  }
  if (st.render) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={st.render.src} srcSet={st.render.srcSet} sizes="(min-width:960px) 58vw, 100vw" width={st.render.width} height={st.render.height} alt={`Studio render: ${st.title} (illustrative, not our workshop)`} loading="lazy" decoding="async" />;
  }
  if (st.id === "home") return <Art art={{ kind: "sofa", layout: "three", wood: "#6e4a2f", fabric: "#8b967f", fabric_type: "linen", legs: "tapered", cushions: "loose" }} tone="ivory" label="Illustration: the finished piece" />;
  return <MakingArt stage={st.id} uid={uid} />;
}

/**
 * Editorial feature. Fully readable without JS or animation; when motion is allowed each
 * spread fades in as it enters view and a small rail shows progress. Nothing blocks scrolling.
 */
export function MakingStory({ stages }: { stages: StageView[] }) {
  const uid = useId().replace(/[^a-z0-9]/gi, "");
  const root = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setMotion(!mq.matches);
    set(); mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const els = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-stage]") ?? []);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const reveal = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    const track = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.getAttribute("data-stage"))); }), { rootMargin: "-45% 0px -45% 0px" });
    els.forEach((el) => { if (motion) reveal.observe(el); else el.classList.add("in"); track.observe(el); });
    return () => { reveal.disconnect(); track.disconnect(); };
  }, [motion, stages.length]);

  const note = stages.some((s) => !s.image);
  return (
    <div className={`mk ${motion ? "js-reveal" : ""}`} ref={root}>
      <nav className={`mk-rail ${active >= 0 ? "on" : ""}`} aria-label="Stages">
        {stages.map((s, i) => <a key={s.id} href={`#stage-${s.id}`} aria-current={i === active ? "true" : undefined}>0{i + 1}</a>)}
      </nav>
      {stages.map((st, i) => (
        <section key={st.id} id={`stage-${st.id}`} className="mk-stage" data-stage={i} aria-labelledby={`h-${st.id}`}>
          <div className="wrap">
            <figure className="mk-fig">
              <Visual st={st} uid={uid + i} />
              {!st.image && note && <figcaption>{st.render ? "Studio render · not our workshop" : "Illustration · not our workshop"}</figcaption>}
            </figure>
            <div className="mk-text">
              <span className="big" aria-hidden="true">0{i + 1}</span>
              <h2 id={`h-${st.id}`}>{st.title}</h2>
              <p>{st.caption}</p>
            </div>
          </div>
        </section>
      ))}
      <section className="mk-close">
        <div className="wrap">
          <h2>Have something made</h2>
          <p className="lede" style={{ margin: "0 auto 28px" }}>Browse what we make, or design your own and bring it to the showroom.</p>
          <div className="row" style={{ justifyContent: "center" }}><Link className="btn gold" href="/design">Design Your Own</Link><Link className="btn ghost" href="/shop">Explore Furniture</Link></div>
        </div>
      </section>
    </div>
  );
}
