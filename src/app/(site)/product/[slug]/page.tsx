import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { Gallery } from "@/components/Gallery";
import { ShortlistButton } from "@/components/ShortlistButton";
import { ContactActions } from "@/components/ContactActions";
import { getPublishedProduct, listPublishedProducts } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { availabilityLabel, configuratorSlug } from "@/lib/constants";
import { formatInr } from "@/lib/util";

type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = getPublishedProduct((await params).slug);
  return { title: p?.name ?? "Product", description: p?.shortDescription };
}

export default async function ProductPage({ params }: P) {
  const p = getPublishedProduct((await params).slug);
  if (!p) notFound();
  const s = getSettings();
  const related = listPublishedProducts({ categorySlug: p.categorySlug, excludeId: p.id, limit: 4 });
  const msg = `Hello, I'm interested in "${p.name}" (${p.categoryName}) from your website. Could you share details?`;
  const spec: [string, string][] = [
    ["Category", p.subcategory ? `${p.categoryName} · ${p.subcategory}` : p.categoryName],
    ["Material", p.material],
    ["Finish", p.finish],
    ["Dimensions", p.dimensions],
    ["Sizes", p.sizes.join(", ")],
    ["Colours", p.colours.join(", ")],
    ["Upholstery", p.upholstery.join(", ")],
    ["Availability", availabilityLabel(p.availability)],
    ["Guarantee", p.warranty],
  ];
  return (
    <div className="wrap">
      <div className="page-head" style={{ paddingBottom: 16 }}>
        <div className="crumbs"><Link href="/">Home</Link> / <Link href="/shop">Furniture</Link> / <Link href={`/shop/${p.categorySlug}`}>{p.categoryName}</Link> / {p.name}</div>
      </div>
      <div className="pdp">
        <Gallery p={p} />
        <div className="pdp-info">
          <span className="eyebrow">{p.categoryName}</span>
          <h1 style={{ fontSize: "clamp(2.2rem,4vw,3.4rem)" }}>{p.name}</h1>
          <p className="lede">{p.shortDescription}</p>
          <p style={{ fontSize: "1.2rem", fontFamily: "var(--font-serif)" }}>
            {p.price ? formatInr(p.price) : p.customisable ? "Made to your design — price on quotation" : "Price on request"}
          </p>
          {p.isSample && (
            <div className="notice warn">This is a sample design shown with an illustration. Sizes, materials and availability are confirmed by the showroom team before you decide.</div>
          )}
          <p>{p.description}</p>
          <dl className="spec">
            {spec.filter(([, v]) => v).map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
          </dl>
          <div className="cta-stack">
            {p.configurator && <Link className="btn" href={`/design/${configuratorSlug(p.configurator)}?product=${p.slug}`}>Configure this design</Link>}
            <Link className={`btn ${p.configurator ? "ghost" : ""}`} href={`/contact?product=${p.slug}&intent=quote`}>Request a quotation</Link>
            <Link className="btn ghost" href={`/showroom?product=${p.slug}#plan`}>Visit the showroom</Link>
            <ShortlistButton item={{ kind: "product", key: p.slug, name: p.name, href: `/product/${p.slug}` }} />
          </div>
          <div style={{ marginTop: 18 }}><ContactActions s={s} message={msg} enquireHref={`/contact?product=${p.slug}`} show={["whatsapp", "call"]} size="sm" /></div>
          <p className="small muted" style={{ marginTop: 18 }}>Delivery and collection details are confirmed with the showroom team.</p>
        </div>
      </div>
      {related.length > 0 && (
        <section style={{ paddingBlock: "60px 100px", borderTop: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "1.8rem" }}>More in {p.categoryName}</h2>
          <div className="p-grid four">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
