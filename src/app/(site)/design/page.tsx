import Link from "next/link";
import type { Metadata } from "next";
import { Art } from "@/components/art";
import { RenderPhoto } from "@/components/Photo";
import { productRender } from "@/lib/renders";
import { CONFIGURATORS, configuratorSlug } from "@/lib/constants";
import type { ArtParams, ConfiguratorType } from "@/lib/types";

export const metadata: Metadata = { title: "Design Your Own" };

const REP: Record<string, string> = { bed: "slatted-headboard-bed", sofa: "three-seater-sofa", sofa_bed: "sofa-cum-bed", dining: "round-dining-table" };
const ART: Record<ConfiguratorType, ArtParams> = {
  bed: { kind: "bed", headboard: "arched", wood: "#a8692f", size: "queen" },
  sofa: { kind: "sofa", layout: "three", fabric: "#8b967f", wood: "#6e4a2f", fabric_type: "linen" },
  sofa_bed: { kind: "sofabed", fabric: "#b5694b", wood: "#6e4a2f" },
  dining: { kind: "dining", shape: "round", capacity: 4, wood: "#b98a52", chairs: "upholstered", fabric: "#34425a" },
};

export default function DesignHub() {
  return (
    <div className="wrap">
      <div className="page-head">
        <span className="eyebrow">Design your own</span>
        <div className="head-split"><h1>Make it yours</h1>
        <p className="lede">Choose the size, finish and fabric, see an illustrative preview, and save your design. Our team confirms what can be made and quotes the price.</p></div>
      </div>
      <div className="p-grid" style={{ paddingBottom: 60 }}>
        {(Object.keys(CONFIGURATORS) as ConfiguratorType[]).map((t) => (
          <Link key={t} href={`/design/${configuratorSlug(t)}`} className="pcard">
            <div className="media">{(() => { const r = productRender(REP[t]); return r ? <RenderPhoto r={r} sizes="(min-width:900px) 33vw, 100vw" tag={false} /> : <Art art={ART[t]} label="" />; })()}</div>
            <h3>{CONFIGURATORS[t].label}</h3>
            <p>{CONFIGURATORS[t].blurb}</p>
          </Link>
        ))}
      </div>
      <div className="split" style={{ paddingBottom: 100, borderTop: "1px solid var(--line)", paddingTop: 48 }}>
        <div>
          <h2 style={{ fontSize: "1.8rem" }}>How it works</h2>
          <ol className="steps-list"><li>Choose your options</li><li>Save and get a reference</li><li>Ask for a quotation, or plan a visit</li><li>We confirm details and price with you</li></ol>
        </div>
        <div className="prose"><p>Previews are illustrations built from your choices — they are not photographs, and not interactive 3D models. Colours on screen are approximate; see fabrics and finishes in the showroom.</p><p>You&apos;ll never be charged online. Nothing is ordered until you speak to the team.</p></div>
      </div>
    </div>
  );
}
