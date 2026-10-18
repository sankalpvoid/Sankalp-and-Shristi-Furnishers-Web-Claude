import Link from "next/link";
import { Art } from "@/components/art";
import { RenderPhoto } from "@/components/Photo";
import { ProductCard } from "@/components/ProductCard";
import { SecHead } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { getSettings, publicClaims } from "@/lib/settings";
import { listCategories, listPublishedProducts, productCountByCategory } from "@/lib/repo";
import { kindRender, siteRender } from "@/lib/renders";
import { PLACEHOLDER } from "@/lib/site-defaults";
import { ManufacturingScroll } from "@/components/ManufacturingScroll";
import { makingSequence, sequenceEnabled } from "@/config/making-sequence";
import type { Category } from "@/lib/types";

const FEATURED_CATS = ["beds", "sofas", "dining-tables", "sofa-cum-beds", "dressing-tables", "mattresses"];
const DESIGN = [
  { href: "/design/bed", key: "bed", n: "01", t: "Bed", d: "Size, headboard, finish and storage.", art: { kind: "bed", headboard: "slatted", wood: "#b98a52", size: "queen" } },
  { href: "/design/sofa", key: "sofa", n: "02", t: "Sofa", d: "Layout from two seats to seven, fabric and legs.", art: { kind: "sofa", layout: "three", fabric: "#34425a", wood: "#6e4a2f", fabric_type: "velvet" } },
  { href: "/design/sofa-cum-bed", key: "sofa-cum-bed", n: "03", t: "Sofa-cum-bed", d: "A sofa by day, a bed for guests at night.", art: { kind: "sofabed", fabric: "#4a4846", wood: "#6e4a2f" } },
  { href: "/design/dining", key: "dining", n: "04", t: "Dining table", d: "Shape, number of seats, finish and chairs.", art: { kind: "dining", shape: "rectangular", capacity: 6, wood: "#a8692f", chairs: "wood" } },
];

function CatImage({ c }: { c: Category }) {
  if (c.image_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={c.image_url} alt="" loading="lazy" decoding="async" />;
  }
  const r = kindRender(c.art_kind);
  if (r) return <RenderPhoto r={r} sizes="(min-width:900px) 40vw, 50vw" tag={false} />;
  return <Art art={{ kind: c.art_kind, wood: "#a8692f", fabric: "#b3aa9b" }} zoom={1.3} label="" />;
}

export default function Home() {
  const s = getSettings();
  const claims = publicClaims(s);
  const cats = listCategories();
  const counts = productCountByCategory();
  const picked = FEATURED_CATS.map((slug) => cats.find((c) => c.slug === slug)).filter(Boolean) as Category[];
  const others = cats.filter((c) => !FEATURED_CATS.includes(c.slug));
  const featured = listPublishedProducts({ featured: true, limit: 4 });
  const hero = siteRender("hero");
  const showroomRender = siteRender("showroom");
  const n = (slug: string) => counts[cats.find((c) => c.slug === slug)?.id ?? -1] ?? 0;

  const ledger = picked.slice(2);
  return (
    <>
      <h1 className="sr">{s.brand.name}: {s.brand.tagline}</h1>

      {/* 1 · Manufacturing sequence: pinned, scroll-scrubbed video (see src/config/making-sequence.ts) */}
      {sequenceEnabled() && <ManufacturingScroll cfg={makingSequence} />}

      {/* 2 · Arrival: the finished piece the sequence ends on, now at full width */}
      <section className="arrival" id="after-sequence" aria-labelledby="arrival-h">
        <div className="wrap arrival-top">
          <Reveal>
            <span className="eyebrow">The finished pieces</span>
            <h2 id="arrival-h" className="arrival-title">Made to be lived with.</h2>
          </Reveal>
          <Reveal delay={120} className="arrival-side">
            <p className="lede">Teak furniture made in our own workshop, and ready-made pieces to take home. Browse the range, design your own, or come and see it in the showroom.</p>
            <div className="row">
              <Link className="btn" href="/shop">Explore Furniture</Link>
              <Link className="btn ghost" href="/design">Design Your Own</Link>
            </div>
          </Reveal>
        </div>
        <Reveal mask className="arrival-media">
          {s.hero.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.hero.image} alt={s.hero.imageAlt} fetchPriority="high" />
          ) : hero ? (
            <RenderPhoto r={hero} alt="A studio render of a sage three-seater sofa in a sunlit room (placeholder image)" sizes="100vw" priority tag="Studio render · placeholder for showroom photography" />
          ) : (
            <>
              <Art art={{ kind: "sofa", layout: "three", wood: "#6e4a2f", fabric: "#8b967f", fabric_type: "linen", legs: "tapered", cushions: "loose" }} tone="ivory" zoom={1.3} label={s.hero.imageAlt} />
              <span className="hero-note ill-tag">Illustration · showroom photography coming</span>
            </>
          )}
        </Reveal>
        <div className="wrap">
          <div className="hero-meta">
            <div><b>Own workshop</b>Made, not just sold</div>
            <div><b>Solid teak</b>In our solid-teak range</div>
            {claims.guarantee && <div><b>{claims.guarantee.headline}</b>Ask for the terms</div>}
          </div>
        </div>
      </section>
      <nav className="quickshop" aria-label="Shop quickly">
        <div className="wrap">
          <Link href="/shop/beds">Beds <span>{n("beds") || ""}</span></Link>
          <Link href="/shop/sofas">Sofas <span>{n("sofas") || ""}</span></Link>
          <Link href="/shop/sofa-cum-beds">Sofa-cum-beds <span>{n("sofa-cum-beds") || ""}</span></Link>
          <Link href="/shop/dining-tables">Dining <span>{n("dining-tables") || ""}</span></Link>
          <Link href="/shop/mattresses">Mattresses <span>{n("mattresses") || ""}</span></Link>
          <Link href="/shop">All furniture <span aria-hidden>→</span></Link>
        </div>
      </nav>

      {/* 3 · Collections: two large pieces, then a typographic index */}
      <section className="section" id="collections">
        <div className="wrap">
          <SecHead eyebrow="Collections" title="Furniture for every room of the house" link={{ href: "/shop", label: "All furniture" }} />
          <div className="coll-feature">
            {picked.slice(0, 2).map((c, i) => (
              <Reveal key={c.slug} delay={i * 110}>
                <Link href={`/shop/${c.slug}`} className="tile">
                  <div className="media"><CatImage c={c} /></div>
                  <div className="tile-label"><h3>{c.name}</h3><span>{counts[c.id] ? `${counts[c.id]} ${counts[c.id] === 1 ? "design" : "designs"}` : "Ask in showroom"}</span></div>
                </Link>
              </Reveal>
            ))}
          </div>
          <ol className="ledger" aria-label="More collections">
            {ledger.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={i * 50}>
                <Link href={`/shop/${c.slug}`} className="ledger-row">
                  <span className="ledger-n" aria-hidden="true">{String(i + 3).padStart(2, "0")}</span>
                  <span className="ledger-t">{c.name}</span>
                  <span className="ledger-s">{counts[c.id] ? `${counts[c.id]} ${counts[c.id] === 1 ? "design" : "designs"}` : "Ask in showroom"}</span>
                  <span className="ledger-go" aria-hidden="true">→</span>
                </Link>
              </Reveal>
            ))}
          </ol>
          {others.length > 0 && (
            <div className="more-links"><b>Also</b>{others.map((c) => <Link key={c.slug} href={`/shop/${c.slug}`}>{c.name}</Link>)}</div>
          )}
        </div>
      </section>

      {/* 4 · Featured */}
      {featured.length > 0 && (
        <section className="section tint">
          <div className="wrap">
            <SecHead eyebrow="Featured" title="A few places to start" link={{ href: "/shop", label: "See everything" }} />
            <div className="p-grid two stagger">{featured.map((p, i) => <Reveal key={p.id} delay={(i % 2) * 110}><ProductCard p={p} sizes="(min-width:760px) 50vw, 100vw" priority={i < 2} /></Reveal>)}</div>
            <p className="small muted" style={{ marginTop: 40 }}>Prices are shared on request. Many pieces can be made to your size, finish and fabric.</p>
          </div>
        </section>
      )}

      {/* 5 · Design your own */}
      <section className="section dark">
        <div className="wrap design-wrap">
          <Reveal className="intro">
            <span className="eyebrow">Design your own</span>
            <h2>Choose the details. We build it.</h2>
            <p className="lede">Pick a size, a finish and a fabric, see your design take shape, and save it. Our team confirms what can be made and the price.</p>
            <ol className="steps-inline"><li>Choose your options</li><li>Save and get a reference</li><li>Ask for a quotation, or visit</li></ol>
            <p className="small" style={{ color: "#a49d90", maxWidth: "40ch" }}>Previews are illustrations, not photographs or interactive 3D models. Final pricing is confirmed by our team.</p>
          </Reveal>
          <div className="design-grid">
            {DESIGN.map((d, i) => {
              const r = siteRender(`design/${d.key}`);
              return (
                <Reveal key={d.href} delay={(i % 2) * 110}>
                  <Link href={d.href} className="dtile">
                    <div className="media">{r ? <RenderPhoto r={r} sizes="(min-width:1000px) 28vw, 50vw" tag={false} /> : <Art art={d.art} tone="charcoal" zoom={1.25} label="" />}</div>
                    <div className="dtile-body">
                      <span className="num">{d.n}</span>
                      <h3>{d.t}</h3>
                      <p>{d.d}</p>
                      <span className="linkarrow">Start designing</span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6 · Showroom */}
      <section className="section">
        <div className="wrap split">
          <Reveal mask className="media showroom-img">
            {showroomRender ? <RenderPhoto r={showroomRender} sizes="(min-width:900px) 50vw, 100vw" tag="Studio render · not our showroom" /> : <Art art={{ kind: "sofa", layout: "five", wood: "#3b2a20", fabric: "#b3aa9b", fabric_type: "boucle" }} tone="stone" zoom={1.1} label="" />}
          </Reveal>
          <Reveal delay={120}>
            <span className="eyebrow">The showroom</span>
            <h2>See it, sit on it, talk it through</h2>
            {claims.legacy && <p className="callout">{claims.legacy}</p>}
            <p style={{ marginTop: claims.legacy ? 24 : 0 }}>{s.story.showroomIntro}</p>
            <dl className="contact-list">
              <div><dt>Address</dt><dd className={s.contact.address ? "hours" : "placeholder on-light"}>{s.contact.address || PLACEHOLDER.address}</dd></div>
              <div><dt>Hours</dt><dd className={s.contact.hours ? "hours" : "placeholder on-light"}>{s.contact.hours || PLACEHOLDER.hours}</dd></div>
              <div><dt>Phone</dt><dd className={s.contact.phone ? "" : "placeholder on-light"}>{s.contact.phone || PLACEHOLDER.phone}</dd></div>
            </dl>
            <div className="row"><Link className="btn" href="/showroom#plan">Plan your visit</Link><Link className="btn ghost" href="/showroom">Showroom details</Link></div>
          </Reveal>
        </div>
      </section>

      {/* 7 · Trust */}
      <section className="section tint">
        <div className="wrap">
          <SecHead eyebrow="What you can count on" title="Honest materials, made properly" />
          <div className="trust-grid" style={claims.guarantee ? undefined : { gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", maxWidth: 900 }}>
            <Reveal><span className="num">01</span><h3>Solid teak</h3><p>{s.story.materialsStatement}</p></Reveal>
            <Reveal delay={90}><span className="num">02</span><h3>Our own workshop</h3><p>We make custom furniture ourselves, so changes to size, finish and fabric are conversations, not special orders to someone else.</p></Reveal>
            {claims.guarantee && <Reveal delay={180}><span className="num">03</span><h3>{claims.guarantee.headline}</h3><p>{claims.guarantee.note}</p></Reveal>}
          </div>
          <p style={{ marginTop: 56, borderTop: "1px solid var(--line)", paddingTop: 28 }}>
            <strong>Sleepwell mattresses.</strong> {s.story.sleepwellText} <Link className="linkarrow" href="/shop/mattresses" style={{ marginLeft: 8 }}>Mattresses</Link>
          </p>
          <p style={{ marginTop: 20 }}><Link className="linkarrow" href="/making">How our furniture is made</Link></p>
        </div>
      </section>

      {/* 8 · Close: a clear next step */}
      <section className="final dark" aria-labelledby="final-h">
        <div className="wrap final-in">
          <Reveal>
            <span className="eyebrow">Your next step</span>
            <h2 id="final-h" className="final-t">Start with a conversation.</h2>
            <p className="lede">Tell us what you have in mind: a piece from the range, or something made to your own size and finish.</p>
            <div className="row">
              <Link className="btn gold" href="/contact">Enquire now</Link>
              <Link className="btn ghost" href="/showroom#plan">Plan a showroom visit</Link>
              <Link className="btn ghost" href="/shop">Browse furniture</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
