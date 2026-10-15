import Link from "next/link";
import { Art } from "./art";
import { RenderPhoto } from "./Photo";
import type { PublicProduct } from "@/lib/types";
import { availabilityLabel } from "@/lib/constants";
import { productRender } from "@/lib/renders";
import { formatInr } from "@/lib/util";

/** Real uploaded photo → temporary studio render for this exact product → labelled illustration. */
export function ProductMedia({ p, className, sizes = "(min-width:1100px) 33vw, (min-width:560px) 50vw, 100vw", priority }: { p: Pick<PublicProduct, "images" | "art" | "name" | "slug">; className?: string; sizes?: string; priority?: boolean }) {
  const img = p.images[0];
  const render = img ? null : productRender(p.slug);
  return (
    <div className={`media ${className ?? ""}`}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img.url} alt={img.alt || p.name} loading={priority ? "eager" : "lazy"} decoding="async" />
      ) : render ? (
        <RenderPhoto r={render} alt={`Studio render of ${p.name} (placeholder image)`} sizes={sizes} priority={priority} />
      ) : (
        <>
          <Art art={p.art} label={`Illustration for ${p.name}`} />
          <span className="ill-tag">Illustration</span>
        </>
      )}
    </div>
  );
}

export function priceLine(p: PublicProduct): string {
  if (p.price) return formatInr(p.price);
  if (p.customisable) return "Made to your design";
  return "Enquire for price";
}

export function ProductCard({ p, sizes, priority }: { p: PublicProduct; sizes?: string; priority?: boolean }) {
  return (
    <Link href={`/product/${p.slug}`} className="pcard">
      <ProductMedia p={p} sizes={sizes} priority={priority} />
      {p.isSample && <span className="chip line" style={{ marginTop: 14 }}>{p.sampleKind === "sample" ? "Sample design" : "Details being confirmed"}</span>}
      <h3 style={p.isSample ? { marginTop: 8 } : undefined}>{p.name}</h3>
      <p>{p.shortDescription}</p>
      <div className="meta">
        <span className={p.price ? "price" : ""}>{priceLine(p)}</span>
        <span>{p.categoryName}</span>
      </div>
    </Link>
  );
}
export { availabilityLabel };
