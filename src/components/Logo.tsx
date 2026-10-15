import type { SiteSettings } from "@/lib/site-defaults";

/** Temporary logo. Replace via Admin → Brand (logo image URL/upload) — no code change needed. */
export function Logo({ brand, compact }: { brand: SiteSettings["brand"]; compact?: boolean }) {
  return (
    <>
      {brand.logoImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="logo-img" src={brand.logoImage} alt="" width={44} height={44} />
      ) : (
        <span className="logo-mark" aria-hidden="true">{brand.logoText}</span>
      )}
      {!compact && (
        <span className="brand-text">
          <b>{brand.name}</b>
          <span>{brand.tagline}</span>
        </span>
      )}
    </>
  );
}
