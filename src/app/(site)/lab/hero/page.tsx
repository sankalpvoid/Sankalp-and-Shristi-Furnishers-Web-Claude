import type { Metadata } from "next";
import Link from "next/link";
import { RenderPhoto } from "@/components/Photo";
import { Art } from "@/components/art";
import { Reveal } from "@/components/Reveal";
import { SecHead } from "@/components/Section";
import { listCategories, productCountByCategory } from "@/lib/repo";
import { kindRender } from "@/lib/renders";
import type { Category } from "@/lib/types";
import { HeroLab } from "./HeroLab";

export const metadata: Metadata = { title: "Hero prototype", robots: { index: false, follow: false } };
const CATS = ["beds", "sofas", "dining-tables", "sofa-cum-beds", "dressing-tables", "mattresses"];

function CatImage({ c }: { c: Category }) {
  if (c.image_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={c.image_url} alt="" loading="lazy" decoding="async" />;
  }
  const r = kindRender(c.art_kind);
  if (r) return <RenderPhoto r={r} sizes="(min-width:900px) 40vw, 50vw" tag={false} />;
  return <Art art={{ kind: c.art_kind, wood: "#a8692f", fabric: "#b3aa9b" }} zoom={1.3} label="" />;
}

export default function HeroPrototype() {
  const cats = listCategories();
  const counts = productCountByCategory();
  const picked = CATS.map((s) => cats.find((c) => c.slug === s)).filter(Boolean) as Category[];
  const label = (c: Category) => (counts[c.id] ? `${counts[c.id]} ${counts[c.id] === 1 ? "design" : "designs"}` : "Ask in showroom");
  return (
    <>
      <HeroLab cats={[...picked.map((c) => ({ slug: c.slug, name: c.name })), ]} />
      {/* The hero resolves into the real catalogue (same data and markup as the current homepage collections). */}
      <section className="section" id="collections">
        <div className="wrap">
          <SecHead eyebrow="Collections" title="Furniture for every room of the house" link={{ href: "/shop", label: "All furniture" }} />
          <div className="coll-feature">
            {picked.slice(0, 2).map((c, i) => (
              <Reveal key={c.slug} delay={i * 110}>
                <Link href={`/shop/${c.slug}`} className="tile">
                  <div className="media"><CatImage c={c} /></div>
                  <div className="tile-label"><h3>{c.name}</h3><span>{label(c)}</span></div>
                </Link>
              </Reveal>
            ))}
          </div>
          <ol className="ledger" aria-label="More collections">
            {picked.slice(2).map((c, i) => (
              <Reveal as="li" key={c.slug} delay={i * 50}>
                <Link href={`/shop/${c.slug}`} className="ledger-row">
                  <span className="ledger-n" aria-hidden="true">{String(i + 3).padStart(2, "0")}</span>
                  <span className="ledger-t">{c.name}</span>
                  <span className="ledger-s">{label(c)}</span>
                  <span className="ledger-go" aria-hidden="true">→</span>
                </Link>
              </Reveal>
            ))}
          </ol>
          <p className="small muted" style={{ marginTop: 56 }}>Prototype route. The live homepage is unchanged. Imagery is placeholder studio renders, not photography of our products.</p>
        </div>
      </section>
    </>
  );
}
