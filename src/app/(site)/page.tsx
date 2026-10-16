import Link from "next/link";
import { Art } from "@/components/art";
import { RenderPhoto } from "@/components/Photo";
import { ProductCard } from "@/components/ProductCard";
import { SecHead } from "@/components/Section";
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
  const makingImg = s.making.find((m) => m.id === "cut");
  const makingRender = siteRender("making/cut");
  const showroomRender = siteRender("showroom");
  const n = (slug: string) => counts[cats.find((c) => c.slug === slug)?.id ?? -1] ?? 0;

  return (
    <>
      {/* Manufacturing sequence: pinned, scroll-scrubbed video (see src/config/making-sequence.ts) */}
      {sequenceEnabled() && <ManufacturingScroll cfg={makingSequence} />}

      {/* HERO */}
      <section className="hero" id="after-sequence">
        <div className="hero-split">
          <div className="hero-copy">
            <span className="eyebrow">{s.brand.name}</span>
            <h1>{s.brand.tagline}</h1>
            <p className="lede">Teak furniture made in our own workshop, and ready-made pieces to take home. Browse the range, design your own, or come and see it in the showroom.</p>
            <div className="row">
              <Link className="btn" href="/shop">Explore Furniture</Link>
              <Link className="btn ghost" href="/design">Design Your Own</Link>
            </div>
            <p style={{ marginTop: 26 }}><Link className="linkarrow" href="/showroom">Discover the showroom</Link></p>
            <div className="hero-meta">
              <div><b>Own workshop</b>Made, not just sold</div>
              <div><b>Solid teak</b>In our solid-teak range</div>
              {claims.guarantee && <div><b>{claims.guarantee.headline}</b>Ask for the terms</div>}
            </div>
          </div>
          <div className="hero-photo">
            {s.hero.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.hero.image} alt={s.hero.imageAlt} fetchPriority="high" />
            ) : hero ? (
              <RenderPhoto r={hero} alt="A studio render of a sage three-seater sofa in a sunlit room (placeholder image)" sizes="(min-width:960px) 58vw, 100vw" priority tag="Studio render · placeholder for showroom photography" />
            ) : (
              <>
                <Art art={{ kind: "sofa", layout: "three", wood: "#6e4a2f", fabric: "#8b967f", fabric_type: "linen", legs: "tapered", cushions: "loose" }} tone="ivory" zoom={1.3} label={s.hero.imageAlt} />
                <span className="hero-note ill-tag">Illustration · showroom photography coming</span>
              </>
            )}
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

      {/* COLLECTIONS */}
      <section className="section">
        <div className="wrap">
          <SecHead eyebrow="Collections" title="Furniture for every room of the house" link={{ href: "/shop", label: "All furniture" }} />
          <div className="cat-grid">
            {picked.map((c) => (
              <Link key={c.slug} href={`/shop/${c.slug}`} className="tile">
                <div className="media"><CatImage c={c} /></div>
                <div className="tile-label"><h3>{c.name}</h3><span>{counts[c.id] ? `${counts[c.id]} ${counts[c.id] === 1 ? "design" : "designs"}` : "Ask in showroom"}</span></div>
              </Link>
            ))}
          </div>
          {others.length > 0 && (
            <div className="more-links"><b>Also</b>{others.map((c) => <Link key={c.slug} href={`/shop/${c.slug}`}>{c.name}</Link>)}</div>
          )}
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="section tint">
          <div className="wrap">
            <SecHead eyebrow="Featured" title="A few places to start" link={{ href: "/shop", label: "See everything" }} />
            <div className="p-grid two">{featured.map((p, i) => <ProductCard key={p.id} p={p} sizes="(min-width:760px) 50vw, 100vw" priority={i < 2} />)}</div>
            <p className="small muted" style={{ marginTop: 40 }}>Prices are shared on request. Many pieces can be made to your size, finish and fabric.</p>
          </div>
        </section>
      )}

      {/* DESIGN YOUR OWN */}
      <section className="section dark">
        <div className="wrap design-wrap">
          <div className="intro">
            <span className="eyebrow">Design your own</span>
            <h2>Choose the details. We build it.</h2>
            <p className="lede">Pick a size, a finish and a fabric, see your design take shape, and save it. Our team confirms what can be made and the price.</p>
            <ol className="steps-inline"><li>Choose your options</li><li>Save and get a reference</li><li>Ask for a quotation, or visit</li></ol>
            <p className="small" style={{ color: "#a49d90", maxWidth: "40ch" }}>Previews are illustrations, not photographs or interactive 3D models. Final pricing is confirmed by our team.</p>
          </div>
          <div className="design-grid">
            {DESIGN.map((d) => {
              const r = siteRender(`design/${d.key}`);
              return (
                <Link key={d.href} href={d.href} className="dtile">
                  <div className="media">{r ? <RenderPhoto r={r} sizes="(min-width:1000px) 28vw, 50vw" tag={false} /> : <Art art={d.art} tone="charcoal" zoom={1.25} label="" />}</div>
                  <div className="dtile-body">
                    <span className="num">{d.n}</span>
                    <h3>{d.t}</h3>
                    <p>{d.d}</p>
                    <span className="linkarrow">Start designing</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ART OF MAKING */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <SecHead eyebrow="The Art of Making" title="From raw wood to the room you live in" link={{ href: "/making", label: "Follow the process" }} />
        </div>
        <div className="band">
          <div className="media">
            {makingImg?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={makingImg.image} alt="" loading="lazy" decoding="async" />
            ) : makingRender ? (
              <RenderPhoto r={makingRender} sizes="100vw" tag="Studio render · not our workshop" />
            ) : (
              <>
                <Art art={{ kind: "stool", wood: "#b98a52" }} tone="sand" label="" />
                <span className="ill-tag">Illustration · workshop photography coming</span>
              </>
            )}
          </div>
          <div className="wrap"><div className="band-card">
            <h2>Made with care, in seven stages</h2>
            <p>{s.story.workshopStory}</p>
            <p style={{ marginBottom: 24 }}>{s.making.map((m) => m.title).join(" · ")}</p>
            <Link className="btn" href="/making" style={{ background: "#f4efe5", color: "var(--ink)", borderColor: "#f4efe5" }}>See how it&apos;s made</Link>
          </div></div>
        </div>
      </section>

      {/* SHOWROOM */}
      <section className="section">
        <div className="wrap split">
          <div className="media" style={{ aspectRatio: "16/10" }}>
            {showroomRender ? <RenderPhoto r={showroomRender} sizes="(min-width:900px) 50vw, 100vw" tag="Studio render · not our showroom" /> : <Art art={{ kind: "sofa", layout: "five", wood: "#3b2a20", fabric: "#b3aa9b", fabric_type: "boucle" }} tone="stone" zoom={1.1} label="" />}
          </div>
          <div>
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
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="section tint">
        <div className="wrap">
          <SecHead eyebrow="What you can count on" title="Honest materials, made properly" />
          <div className="trust-grid" style={claims.guarantee ? undefined : { gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", maxWidth: 900 }}>
            <div><span className="num">01</span><h3>Solid teak</h3><p>{s.story.materialsStatement}</p></div>
            <div><span className="num">02</span><h3>Our own workshop</h3><p>We make custom furniture ourselves, so changes to size, finish and fabric are conversations, not special orders to someone else.</p></div>
            {claims.guarantee && <div><span className="num">03</span><h3>{claims.guarantee.headline}</h3><p>{claims.guarantee.note}</p></div>}
          </div>
          <p style={{ marginTop: 56, borderTop: "1px solid var(--line)", paddingTop: 28 }}>
            <strong>Sleepwell mattresses.</strong> {s.story.sleepwellText} <Link className="linkarrow" href="/shop/mattresses" style={{ marginLeft: 8 }}>Mattresses</Link>
          </p>
        </div>
      </section>
    </>
  );
}
