import manifest from "./renders-manifest.json";

/**
 * Temporary studio renders (public/renders/**). These are generated placeholders from
 * tools/render — NOT photographs of real stock, showroom or workshop. Anything uploaded in
 * admin (product photos, hero/making images in settings) always takes precedence.
 */
const FILES: Set<string> = new Set(manifest as string[]);

export interface RenderImg { src: string; srcSet: string; width: number; height: number }
const SIZES: Record<string, [number, number]> = { products: [1500, 1200], design: [1200, 900], making: [1600, 1000], hero: [1800, 1500], showroom: [1800, 1125] };

function make(name: string): RenderImg | null {
  const f = FILES;
  if (!f.has(name + ".webp")) return null;
  const [width, height] = SIZES[name.split("/")[0]] ?? [1500, 1200];
  const sm = f.has(name + "-sm.webp") ? `/renders/${name}-sm.webp 800w, ` : "";
  return { src: `/renders/${name}.webp`, srcSet: `${sm}/renders/${name}.webp ${width}w`, width, height };
}
export const siteRender = (name: string) => make(name);
export const productRender = (slug: string) => make(`products/${slug}`);

const KIND_REP: Record<string, string> = {
  bed: "slatted-headboard-bed", divan: "divan-cum-bed", dressing: "dressing-table-with-mirror", chair: "bedroom-accent-chair",
  sofa: "three-seater-sofa", sofabed: "sofa-cum-bed", couch: "lounge-couch", centretable: "teak-centre-table", stool: "wooden-stool",
  dining: "six-seater-dining-table", diningchair: "wooden-dining-chair", mattress: "sleepwell-mattresses",
};
/** Representative render for a category (by illustration kind). */
export const kindRender = (kind: string) => (KIND_REP[kind] ? productRender(KIND_REP[kind]) : null);
