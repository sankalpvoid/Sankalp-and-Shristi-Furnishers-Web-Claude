"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Art } from "./art";
import { MakingArt } from "./art/making";
import type { MakingStage } from "@/lib/site-defaults";

function Visual({ st, uid }: { st: MakingStage; uid: string }) {
  if (st.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={st.image} alt={st.title} loading="lazy" decoding="async" />;
  }
  if (st.id === "home") return <Art art={{ kind: "sofa", layout: "three", wood: "#6e4a2f", fabric: "#8b967f", fabric_type: "linen", legs: "tapered", cushions: "loose" }} tone="ivory" label="Illustration: the finished piece" />;
  return <MakingArt stage={st.id} uid={uid} />;
}

/**
 * Server renders a plain stacked layout (works without JS / animation).
 * With JS + motion allowed, it upgrades to a sticky stage that cross-fades on scroll.
 */
export function MakingStory({ stages }: { stages: MakingStage[] }) {
  const uid = useId().replace(/[^a-z0-9]/gi, "");
  const [enhanced, setEnhanced] = useState(false);
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setEnhanced(!mq.matches && window.innerWidth >= 700);
    set();
    mq.addEventListener("change", set);
    window.addEventListener("resize", set);
    return () => { mq.removeEventListener("change", set); window.removeEventListener("resize", set); };
  }, []);

  useEffect(() => {
    if (!enhanced) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.getAttribute("data-i"))); }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, [enhanced]);

  const note = stages.some((s) => !s.image) ? "Illustration · workshop photography coming" : "";

  if (!enhanced) {
    return (
      <div className="making static">
        <div className="wrap">
          {stages.map((st, i) => (
            <div className="making-stage" key={st.id}>
              <div style={{ width: "100%" }}>
                <div className="making-frame" style={{ margin: "0 auto" }}><div className="layer on"><Visual st={st} uid={uid + i} /></div>{!st.image && <span className="stage-note">{note}</span>}</div>
                <div className="making-step"><div className="making-card"><span className="num">0{i + 1} / 0{stages.length}</span><h3>{st.title}</h3><p>{st.caption}</p></div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="wrap section tight"><Closing /></div>
      </div>
    );
  }

  return (
    <div className="making">
      <div className="making-track">
        <div className="making-stage" aria-hidden="true">
          <div className="making-frame">
            {stages.map((st, i) => <div key={st.id} className={`layer ${i === active ? "on" : ""}`}><Visual st={st} uid={uid + i} /></div>)}
            {note && <span className="stage-note">{note}</span>}
          </div>
          <div className="progress">{stages.map((s, i) => <i key={s.id} className={i <= active ? "on" : ""} />)}</div>
        </div>
        <div className="making-steps wrap">
          {stages.map((st, i) => (
            <div className="making-step" key={st.id} data-i={i} ref={(el) => { refs.current[i] = el; }}>
              <div className="making-card"><span className="num">0{i + 1} / 0{stages.length}</span><h3>{st.title}</h3><p>{st.caption}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="wrap section tight"><Closing /></div>
    </div>
  );
}

function Closing() {
  return (
    <div className="row" style={{ justifyContent: "center", textAlign: "center", flexDirection: "column", gap: 20 }}>
      <h2 style={{ margin: 0 }}>Have something made</h2>
      <p style={{ color: "#cfc6b6", margin: 0 }}>Browse what we make, or design your own and take it to the showroom.</p>
      <div className="row"><Link className="btn gold" href="/design">Design Your Own</Link><Link className="btn ghost" href="/shop">Explore Furniture</Link></div>
    </div>
  );
}
