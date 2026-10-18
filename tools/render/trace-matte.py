#!/usr/bin/env python3
"""Traces an object matte (white on black PNG) into closed SVG contour paths (marching squares at level 0.5).
   python3 tools/render/trace-matte.py matte.png out.json [eps]
The paths share the matte's pixel coordinate system, which is the beauty render's, so they register exactly."""
import sys, json, math
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
eps = float(sys.argv[3]) if len(sys.argv) > 3 else 0.3
a = np.asarray(Image.open(src).convert("L"), dtype=np.float32) / 255.0
H, W = a.shape
# pad so every contour closes
a = np.pad(a, 1)
b = a >= 0.5
tl, tr, bl, br = b[:-1, :-1], b[:-1, 1:], b[1:, :-1], b[1:, 1:]
mixed = ~((tl == tr) & (tl == bl) & (tl == br))
ys, xs = np.nonzero(mixed)

def lerp(v0, v1):  # position along an edge where value crosses 0.5
    d = v1 - v0
    return 0.5 if abs(d) < 1e-6 else (0.5 - v0) / d

# edges keyed as ("h", x, y): between (x,y)-(x+1,y); ("v", x, y): between (x,y)-(x,y+1)
def pt(e):
    k, x, y = e
    if k == "h":
        return (x + lerp(a[y, x], a[y, x + 1]) - 1, y - 1)
    return (x - 1, y + lerp(a[y, x], a[y + 1, x]) - 1)

adj = {}
def link(e1, e2):
    adj.setdefault(e1, []).append(e2); adj.setdefault(e2, []).append(e1)
# case table by corner bits (tl,tr,br,bl) -> pairs of edges (top, right, bottom, left)
for y, x in zip(ys.tolist(), xs.tolist()):
    c = (tl[y, x] << 3) | (tr[y, x] << 2) | (br[y, x] << 1) | bl[y, x]
    T, R, B, L = ("h", x, y), ("v", x + 1, y), ("h", x, y + 1), ("v", x, y)
    segs = {1: [(L, B)], 2: [(B, R)], 3: [(L, R)], 4: [(T, R)], 6: [(T, B)], 7: [(L, T)], 8: [(L, T)], 9: [(T, B)], 11: [(T, R)], 12: [(L, R)], 13: [(B, R)], 14: [(L, B)]}.get(c)
    if c == 5:  # saddle
        segs = [(L, T), (B, R)] if a[y:y + 2, x:x + 2].mean() < 0.5 else [(L, B), (T, R)]
    if c == 10:
        segs = [(L, B), (T, R)] if a[y:y + 2, x:x + 2].mean() < 0.5 else [(L, T), (B, R)]
    for s in segs or []:
        link(*s)

seen, loops = set(), []
for start in adj:
    if start in seen: continue
    loop, prev, cur = [], None, start
    while True:
        seen.add(cur); loop.append(cur)
        nxt = [n for n in adj[cur] if n != prev and n not in seen] or [n for n in adj[cur] if n == start and len(loop) > 2]
        if not nxt: break
        prev, cur = cur, nxt[0]
        if cur == start: break
    if len(loop) > 8: loops.append([pt(e) for e in loop])

def rdp(p, e):
    if len(p) < 3: return p
    (x1, y1), (x2, y2) = p[0], p[-1]
    dx, dy = x2 - x1, y2 - y1
    n = math.hypot(dx, dy) or 1e-9
    dmax, idx = 0, 0
    for i in range(1, len(p) - 1):
        d = abs(dy * p[i][0] - dx * p[i][1] + x2 * y1 - y2 * x1) / n
        if d > dmax: dmax, idx = d, i
    if dmax > e:
        return rdp(p[: idx + 1], e)[:-1] + rdp(p[idx:], e)
    return [p[0], p[-1]]

def area(p): return 0.5 * sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))
def smooth(pts, corner_deg=55):
    """Closed polyline -> cubic Bezier path: straight runs stay straight, soft turns become curves, sharp corners are kept."""
    n = len(pts)
    def unit(v):
        m = math.hypot(*v) or 1e-9
        return (v[0] / m, v[1] / m)
    tan, sharp = [], []
    for i in range(n):
        a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
        v1, v2 = (b[0] - a[0], b[1] - a[1]), (c[0] - b[0], c[1] - b[1])
        u1, u2 = unit(v1), unit(v2)
        ang = math.degrees(math.acos(max(-1, min(1, u1[0] * u2[0] + u1[1] * u2[1]))))
        sharp.append(ang > corner_deg)
        tan.append(unit((c[0] - a[0], c[1] - a[1])))
    d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for i in range(n):
        j = (i + 1) % n
        L = math.hypot(pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]) / 3
        c1 = pts[i] if sharp[i] else (pts[i][0] + tan[i][0] * L, pts[i][1] + tan[i][1] * L)
        c2 = pts[j] if sharp[j] else (pts[j][0] - tan[j][0] * L, pts[j][1] - tan[j][1] * L)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {pts[j][0]:.1f} {pts[j][1]:.1f}"
    return d + "Z"

res = []
for lp in loops:
    # rotate so the loop starts at its top-left-most point (stable draw direction)
    k = min(range(len(lp)), key=lambda i: (lp[i][1] + lp[i][0] * 0.001))
    lp = lp[k:] + lp[:k]
    far = max(range(len(lp)), key=lambda i: (lp[i][0] - lp[0][0]) ** 2 + (lp[i][1] - lp[0][1]) ** 2)  # split a closed loop at its far point so RDP has a baseline
    lp = rdp(lp[: far + 1], eps)[:-1] + rdp(lp[far:] + [lp[0]], eps)[:-1]
    if len(lp) < 3: continue
    xs_, ys_ = [q[0] for q in lp], [q[1] for q in lp]
    ar = abs(area(lp))
    if ar < 6: continue
    d = smooth(lp)
    length = sum(math.hypot(lp[i][0] - lp[i - 1][0], lp[i][1] - lp[i - 1][1]) for i in range(len(lp)))
    res.append({"d": d, "bbox": [round(min(xs_)), round(min(ys_)), round(max(xs_)), round(max(ys_))], "area": round(ar), "len": round(length), "n": len(lp)})
res.sort(key=lambda r: (r["bbox"][0], r["bbox"][1]))
json.dump({"w": W, "h": H, "paths": res}, open(out, "w"), separators=(",", ":"))
print(f"{len(res)} contours, {sum(r['n'] for r in res)} points, {len(json.dumps(res)) // 1024} KB")
