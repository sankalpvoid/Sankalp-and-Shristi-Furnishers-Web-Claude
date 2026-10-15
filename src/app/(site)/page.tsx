import Link from "next/link";
import { Art } from "@/components/art";
import { ProductCard } from "@/components/ProductCard";
import { SecHead } from "@/components/Section";
import { getSettings, publicClaims } from "@/lib/settings";
import { listCategories, listPublishedProducts, productCountByCategory } from "@/lib/repo";
import { PLACEHOLDER } from "@/lib/site-defaults";

const FEATURED_CATS = ["beds", "sofas", "dining-tables", "sofa-cum-beds", "dressing-tables", "mattresses"];

export default function Home() {
  const s = getSettings();
  const claims = publicClaims(s);
  const cats = listCategories();
  const counts = productCountByCategory();
  const picked = FEATURED_CATS.map((slug) => cats.find((c) => c.slug === slug)).filter(Boolean) as typeof cats;
  const featured = listPublishedProducts({ featured: true, limit: 4 });

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{s.brand.name}</span>
            <h1>{s.brand.tagline}</h1>
            <p className="lede">
              Teak furniture made in our own workshop, and ready-made pieces to take home. Browse the range, design your own, or come and see it in the showroom.
            </p>
            <div className="row" style={{ marginTop: 28 }}>
              <Link className="btn" href="/shop">Explore Furniture</Link>
              <Link className="btn ghost" href="/design">Design Your Own</Link>
              <Link className="linkarrow" href="/showroom" style={{ marginLeft: 8 }}>Visit the showroom</Link>
            </div>
            <div className="hero-meta">
              <div><b>Own workshop</b>Made, not just sold</div>
              <div><b>Solid teak</b>In our solid-teak range</div>
              {claims.guarantee && <div><b>{claims.guarantee.headline}</b>Ask for the terms</div>}
            </div>
          </div>
          <div className="hero-art">
            {s.hero.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.hero.image} alt={s.hero.imageAlt} fetchPriority="high" />
            ) : (
              <>
                <Art art={{ kind: "sofa", layout: "five", wood: "#6e4a2f", fabric: "#8b967f", fabric_type: "linen", legs: "tapered", cushions: "loose" }} tone="ivory" zoom={1.3} label={s.hero.imageAlt} />
                <span className="hero-note">Illustration · showroom photography coming</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="section tint">
        <div className="wrap">
          <SecHead eyebrow="Collections" title="Furniture for every room of the house" link={{ href: "/shop", label: "All furniture" }} />
          <div className="cat-grid">
            {picked.map((c) => (
              <Link key={c.slug} href={`/shop/${c.slug}`} className="tile">
                <div className="media">
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt="" loading="lazy" />
                  ) : (
                    <Art art={{ kind: c.art_kind, wood: "#a8692f", fabric: "#b3aa9b", tone: c.slug === "mattresses" ? "stone" : "ivory" }} zoom={1.3} label="" />
                  )}
                </div>
                <div className="tile-label"><h3>{c.name}</h3><span>{counts[c.id] ? `${counts[c.id]} ${counts[c.id] === 1 ? "design" : "designs"}` : "Ask in showroom"}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="section">
          <div className="wrap">
            <SecHead eyebrow="Featured" title="A few places to start" link={{ href: "/shop", label: "See everything" }} />
            <div className="p-grid four">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            <p className="small muted" style={{ marginTop: 28 }}>Prices are shared on request. Many pieces can be made to your size, finish and fabric.</p>
          </div>
        </section>
      )}

      {/* DESIGN YOUR OWN */}
      <section className="section dark">
        <div className="wrap">
          <SecHead eyebrow="Design your own" title="Choose the details. We build it." link={{ href: "/design", label: "How it works" }} />
          <div className="design-grid">
            {[
              { href: "/design/bed", n: "01", t: "Bed", d: "Size, headboard, finish and storage.", art: { kind: "bed", headboard: "slatted", wood: "#b98a52", size: "queen" } },
              { href: "/design/sofa", n: "02", t: "Sofa", d: "Layout from two seats to seven, fabric and legs.", art: { kind: "sofa", layout: "three", fabric: "#34425a", wood: "#6e4a2f", fabric_type: "velvet" } },
              { href: "/design/sofa-cum-bed", n: "03", t: "Sofa-cum-bed", d: "A sofa by day, a bed for guests at night.", art: { kind: "sofabed", fabric: "#4a4846", wood: "#6e4a2f" } },
              { href: "/design/dining", n: "04", t: "Dining table", d: "Shape, number of seats, finish and chairs.", art: { kind: "dining", shape: "rectangular", capacity: 6, wood: "#a8692f", chairs: "wood" } },
            ].map((d) => (
              <Link key={d.href} href={d.href} className="dtile">
                <div className="media"><Art art={d.art} tone="charcoal" label="" /></div>
                <div className="dtile-body">
                  <span className="num">{d.n}</span>
                  <h3>{d.t}</h3>
                  <p>{d.d}</p>
                  <span className="linkarrow">Start designing</span>
                </div>
              </Link>
            ))}
          </div>
          <p className="small" style={{ marginTop: 28, color: "#a79f91", maxWidth: "70ch" }}>
            Previews are illustrations, not 3D models or photographs. Save your design to get a reference number, then bring it to the showroom or ask for a quotation. Pricing is confirmed by our team.
          </p>
        </div>
      </section>

      {/* ART OF MAKING */}
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow">The Art of Making</span>
            <h2>From raw wood to the room you live in</h2>
            <p className="lede">{s.story.workshopStory}</p>
            <ol className="steps-list">
              {s.making.map((m) => <li key={m.id}>{m.title}</li>)}
            </ol>
            <Link className="btn" href="/making">Follow the process</Link>
          </div>
          <div className="media" style={{ aspectRatio: "4/4.4" }}>
            {s.making[0]?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.making[0].image} alt="" loading="lazy" />
            ) : (
              <>
                <Art art={{ kind: "stool", wood: "#b98a52" }} tone="sand" label="" />
                <span className="ill-tag">Illustration · workshop photography coming</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* SHOWROOM */}
      <section className="section tint">
        <div className="wrap split">
          <div>
            <span className="eyebrow">The showroom</span>
            <h2>See it, sit on it, talk it through</h2>
            {claims.legacy && <p className="callout">{claims.legacy}</p>}
            <p style={{ marginTop: claims.legacy ? 24 : 0 }}>{s.story.showroomIntro}</p>
            <div className="row" style={{ marginTop: 24 }}>
              <Link className="btn" href="/showroom#plan">Plan your visit</Link>
              <Link className="btn ghost" href="/showroom">Address &amp; hours</Link>
            </div>
          </div>
          <dl className="kv" style={{ gridTemplateColumns: "7em 1fr", rowGap: 20 }}>
            <dt>Address</dt><dd className={s.contact.address ? "hours" : "placeholder on-light"}>{s.contact.address || PLACEHOLDER.address}</dd>
            <dt>Hours</dt><dd className={s.contact.hours ? "hours" : "placeholder on-light"}>{s.contact.hours || PLACEHOLDER.hours}</dd>
            <dt>Phone</dt><dd className={s.contact.phone ? "" : "placeholder on-light"}>{s.contact.phone || PLACEHOLDER.phone}</dd>
          </dl>
        </div>
      </section>

      {/* TRUST */}
      <section className="section">
        <div className="wrap">
          <SecHead eyebrow="What you can count on" title="Honest materials, made properly" />
          <div className="trust-grid" style={claims.guarantee ? undefined : { gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", maxWidth: 900 }}>
            <div><span className="num">01</span><h3>Solid teak</h3><p>{s.story.materialsStatement}</p></div>
            <div><span className="num">02</span><h3>Our own workshop</h3><p>We make custom furniture ourselves, so changes to size, finish and fabric are conversations, not special orders to someone else.</p></div>
            {claims.guarantee && <div><span className="num">03</span><h3>{claims.guarantee.headline}</h3><p>{claims.guarantee.note}</p></div>}
          </div>
          <p style={{ marginTop: 48, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
            <strong>Sleepwell mattresses.</strong> {s.story.sleepwellText} <Link className="linkarrow" href="/shop/mattresses">Mattresses</Link>
          </p>
        </div>
      </section>
    </>
  );
}
