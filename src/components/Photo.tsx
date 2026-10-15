import type { RenderImg } from "@/lib/renders";

export const RENDER_TAG = "Studio render · placeholder";

/** A temporary studio render. Always labelled as a placeholder — never presented as a real photograph. */
export function RenderPhoto({ r, alt = "", sizes = "100vw", priority = false, tag = true }: { r: RenderImg; alt?: string; sizes?: string; priority?: boolean; tag?: boolean | string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={r.src} srcSet={r.srcSet} sizes={sizes} width={r.width} height={r.height} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : "auto"} />
      {tag && <span className="ill-tag">{typeof tag === "string" ? tag : RENDER_TAG}</span>}
    </>
  );
}
