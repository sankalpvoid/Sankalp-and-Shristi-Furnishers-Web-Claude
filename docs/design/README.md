# Design phase notes

## Critique of the first build (see `before/`)

| Area | Problem |
|---|---|
| Imagery | Every picture was a flat clip-art SVG on the same beige wash. Furniture was small in its frame, nothing felt photographic, and all cards looked alike. This was the single biggest weakness. |
| Palette | Brown/beige dominated (brown eyebrows, links and pills). Charcoal and brass were barely used, so nothing felt "premium contemporary". |
| Typography | Good typeface, timid scale. Catalogue headings were small, labels were sentence-case and soft, buttons were generic pills. |
| Homepage | Arch-shaped illustration with a lot of empty wall; no instant route into the catalogue; the collections grid looked like a template. |
| Catalogue | Four small cards across, two rows of heavy filter pills, tall page headers that pushed products below the fold. Images too small to appreciate the furniture. |
| Product page | Small image, weak hierarchy between price, notice and specs. |
| Configurator | Preview was reasonably prominent but the controls looked like generic form chips with no sense of sequence; no summary beside the Save action on mobile. |
| Art of Making | A sticky cross-fade of cartoon icons, i.e. a "sequence of cards" rather than a feature. |
| Showroom | Small image, sparse, placeholders unstyled. |

## What changed

* **Imagery:** a small offline renderer (`tools/render`) produces clearly-labelled **studio renders** (procedural 3D furniture lit by a sun-window and soft sky/ambient-occlusion samples, accumulated for soft shadows). They replace flat illustrations for the hero, every seed product, the four "design your own" tiles, the showroom and the seven making stages. No third-party images are used (stock-photo hosts are blocked in the build environment), so there are no licences to track; the only dependency is `three` (MIT, dev-only).
* **Honest labelling:** every render carries a "Studio render · placeholder" tag (and "not our workshop" / "not our showroom" where relevant). Seed products remain "Sample design". Illustrations are still used for the live configurator preview (which must react to every option) and for owner-created products that have no photo.
* **Layout/typography:** new scale (hero up to 7rem, tight tracking), uppercase tracked labels with a brass rule, squared quiet buttons, underline tabs instead of pills, large 5:4 product images in a 3-up (2-up on tablet, 1-up on phones) grid, bleed-edge hero with a one-line quick-shop bar, charcoal "design your own" section, editorial Art of Making.
* **Colour:** warm ivory paper, charcoal ink and night sections, brass as the only accent; brown reduced to the furniture itself.

## Replacing temporary imagery with real photography (no code changes)

| What | Where |
|---|---|
| Product photos | Admin → Products → *Photographs* (first image is the main one; it overrides the render everywhere) |
| Homepage hero | Admin → Brand & contact → *Homepage hero image address* (upload first, paste the `/uploads/…` path) |
| Art of Making stages | Admin → Brand & contact → each stage's *Photo address* |
| Category tile image | Admin → Categories → *Image URL* |
| Logo | Admin → Brand & contact → *Logo image address* |
| Showroom / "design your own" tiles | Delete `public/renders/showroom*.webp` / `public/renders/design/*` once real images are wired in, or keep as fallback |

## Regenerating the renders

```bash
npm install                                   # installs three (dev)
export NODE_PATH=$(npm root -g)               # needs Playwright + Chromium
node tools/render/render.cjs --list           # job names
node tools/render/render.cjs --only hero,products/panel-bed
node tools/render/render.cjs --scale=0.5      # quick low-res check
```
Jobs live in `tools/render/jobs.js`, furniture and materials in `tools/render/kit.js`. Output goes to `public/renders/` as WebP (full + `-sm` 800px for cards). A full run takes roughly an hour on a 4-core CPU without a GPU.
