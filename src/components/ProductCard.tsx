import Link from "next/link";
import { Art } from "./art";
import type { PublicProduct } from "@/lib/types";
import { availabilityLabel } from "@/lib/constants";
import { formatInr } from "@/lib/util";

export function ProductMedia({ p, className }: { p: Pick<PublicProduct, "images" | "art" | "name">; className?: string }) {
  const img = p.images[0];
  return (
    <div className={`media ${className ?? ""}`}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img.url} alt={img.alt || p.name} loading="lazy" decoding="async" />
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

export function ProductCard({ p }: { p: PublicProduct }) {
  return (
    <Link href={`/product/${p.slug}`} className="pcard">
      <ProductMedia p={p} />
      <h3>{p.name}</h3>
      <p>{p.shortDescription}</p>
      <div className="meta">
        <span className={p.price ? "price" : ""}>{priceLine(p)}</span>
        <span>{p.categoryName}</span>
      </div>
    </Link>
  );
}
export { availabilityLabel };
