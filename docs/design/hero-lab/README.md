# Hero prototype: "Elevation" (`/lab/hero`)

Isolated prototype route. The live homepage, catalogue, configurators, enquiries and admin are untouched.

## What it is
One scroll-progress value (0–1) drives the whole hero: a camera pull-back from the headboard slats to the whole bed, the drawing of the bed's contours, the bed emerging inside its own silhouette (top to bottom), the room growing outward from the bed's own contour as one smooth shape, and the final full-bleed image with a path into the catalogue. Everything after a ~1.4 s draw-on at load is a pure function of scroll position, so it reverses exactly. No animation library.

## Why the drawing and photograph register
The lines are not hand-placed. `tools/render/matte.cjs` renders flat mattes (silhouette, per-part IDs, slats) from the same 3D scene and camera as the beauty render; `tools/render/trace-bed.py` traces them into SVG paths (marching squares, Bezier smoothing) and writes `src/app/(site)/lab/hero/bed-trace.json` plus `public/lab/bed-matte.png`. Drawing, mask and image share one 1500×1200 coordinate space.

Rebuild: `NODE_PATH=$(npm root -g) python3 tools/render/trace-bed.py`

## Phones are a separate composition
A stacked layout that never swaps: the drawing and, later, the finished plate live in the upper part of the stage; the headline stays large below them exactly as at the opening, and only rises to sit under the plate during the reveal. The camera is keyframed (monotone cubic): the headboard fits the width first, the whole bed is framed by 32 %, and the body is drawn into that steady frame, so nothing is cropped by the screen edge while it draws.

## How the room is revealed
Not an arch and not a straight edge: nested contours from a *blurred* distance field around the bed silhouette (60 levels, see `tools/render/trace-bed.py`), crossfaded as you scroll. Wall above and floor below arrive together and the edge is always one smooth shape. The bed's measured silhouette is also what the drawing and the emergence mask use.

Known cost: the contour data is ~130 KB of JSON in the client bundle. A production version should ship the distance field as a single image and threshold it, or move this to a shader.

## Placeholder status
The bed image is a placeholder studio render (`public/renders/products/slatted-headboard-bed.webp`), labelled on the page. It is not product photography. The traced data only fits this render; a real photograph needs its own tracing.

## Assets needed to make this real
- One straight-on photograph of an actual bed with a slatted headboard, slight elevation, plain neutral wall, whole headboard and both sides in frame, at least 2400 px wide, plus a 4:5 portrait crop for phones.
- Ideally a second frame of the same bed with the room removed or a clean backdrop, so the silhouette can be cut with a real matte instead of a traced one.
- A close-up of the timber slats (for a later texture beat).

## Tests
`NODE_PATH=$(npm root -g) node e2e/hero-lab.cjs` (server on :3100). Covers desktop 1440×900 and phone 390×844: pinning, release, monotonic camera, exact reversal, skip paths, links, resize, reduced motion and JavaScript-off.

Screenshots from the production build are in this folder.
