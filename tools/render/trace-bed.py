#!/usr/bin/env python3
"""Builds the /lab/hero drawing data from the offline renderer's mattes (see matte.cjs).
   NODE_PATH=$(npm root -g) python3 tools/render/trace-bed.py
Outputs: src/app/(site)/lab/hero/bed-trace.json (contours per part) and public/lab/bed-matte.png (silhouette alpha).
Everything shares the beauty render's 1500x1200 pixel space, so drawing, mask and photograph register exactly."""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
tmp = tempfile.mkdtemp()
job = "products/slatted-headboard-bed"
env = dict(os.environ)
def matte(only, name): 
    out = os.path.join(tmp, name + "2x.png")
    subprocess.run(["node", os.path.join(root, "tools/render/matte.cjs"), job, out, "2", only], check=True, env=env, cwd=root)
    return Image.open(out).convert("RGB")
def down(mask):  # boolean 2x mask -> smooth 1x gray
    return Image.fromarray((mask * 255).astype("uint8")).resize((1500, 1200), Image.LANCZOS)

ids = np.asarray(matte("ids", "ids"))
R, G, B = ids[..., 0] > 127, ids[..., 1] > 127, ids[..., 2] > 127
parts = {
    "frame": R & ~G & ~B,
    "bedding": ~R & G & ~B,
    "throw": ~R & ~G & B,
    "pillow": R & G & ~B,
    "head": (R & ~G & B) | (~R & G & B),  # rails/backing + visible slats
}
union = R | G | B
sl = np.asarray(matte("slat", "slat"))[..., 0] > 127
masks = {k: down(v) for k, v in parts.items()}
masks["slat"] = down(sl)
masks["outline"] = down(union)  # whole-object silhouette: the room is revealed by growing outward from this contour
os.makedirs(os.path.join(root, "public/lab"), exist_ok=True)
down(union).save(os.path.join(root, "public/lab/bed-matte.png"), optimize=True)

groups = {}
eps = {"slat": 0.8, "head": 0.7, "frame": 0.6, "bedding": 0.5, "throw": 0.5, "pillow": 0.5, "outline": 0.5}
for k, im in masks.items():
    p = os.path.join(tmp, k + ".png"); im.save(p)
    o = os.path.join(tmp, k + ".json")
    subprocess.run([sys.executable, os.path.join(root, "tools/render/trace-matte.py"), p, o, str(eps[k])], check=True, stdout=subprocess.DEVNULL)
    groups[k] = json.load(open(o))["paths"]
    print(k, len(groups[k]), "contours")
# --- room reveal levels ---------------------------------------------------------------------------------------------
# Nested, smooth contours around the object: threshold a *blurred* distance-to-silhouette field at increasing levels.
# Because the field is smoothed, rail steps and pillow bumps round off as the shape grows (a plain offset of the outline
# would stay lumpy). The page crossfades between adjacent levels.
S = (np.asarray(down(union), dtype=np.float32) / 255.0) > 0.5
H, W = S.shape
INF = 1e9
d = np.where(S, 0.0, INF).astype(np.float64)
# chamfer 5-7-11 distance transform (two passes), ~2 % from Euclidean
def chamfer(d):
    for y in range(H):
        row = d[y]; up = d[y - 1] if y else None; up2 = d[y - 2] if y > 1 else None
        for x in range(W):
            v = row[x]
            if v == 0: continue
            if x: v = min(v, row[x - 1] + 5)
            if up is not None:
                v = min(v, up[x] + 5)
                if x: v = min(v, up[x - 1] + 7)
                if x < W - 1: v = min(v, up[x + 1] + 7)
                if up2 is not None:
                    if x: v = min(v, up2[x - 1] + 11)
                    if x < W - 1: v = min(v, up2[x + 1] + 11)
            row[x] = v
    for y in range(H - 1, -1, -1):
        row = d[y]; dn = d[y + 1] if y < H - 1 else None; dn2 = d[y + 2] if y < H - 2 else None
        for x in range(W - 1, -1, -1):
            v = row[x]
            if v == 0: continue
            if x < W - 1: v = min(v, row[x + 1] + 5)
            if dn is not None:
                v = min(v, dn[x] + 5)
                if x: v = min(v, dn[x - 1] + 7)
                if x < W - 1: v = min(v, dn[x + 1] + 7)
                if dn2 is not None:
                    if x: v = min(v, dn2[x - 1] + 11)
                    if x < W - 1: v = min(v, dn2[x + 1] + 11)
            row[x] = v
    return d / 5.0
D = chamfer(d)
D = np.minimum(D, 1400)
# gaussian blur by FFT (sigma 70 px)
fy_, fx_ = np.fft.fftfreq(H)[:, None], np.fft.fftfreq(W)[None, :]
sigma = 70.0
G = np.exp(-2 * (np.pi ** 2) * (sigma ** 2) * (fx_ ** 2 + fy_ ** 2))
Ds = np.real(np.fft.ifft2(np.fft.fft2(D) * G))
T0, RATIO, N = 24.0, 1.0665, 60
levels = []
for k in range(N):
    t = T0 * RATIO ** k
    g = np.clip(0.5 + (t - Ds) / 2.0, 0, 1)
    Image.fromarray((g * 255).astype("uint8")).save(os.path.join(tmp, f"lvl{k}.png"))
    o = os.path.join(tmp, f"lvl{k}.json")
    subprocess.run([sys.executable, os.path.join(root, "tools/render/trace-matte.py"), os.path.join(tmp, f"lvl{k}.png"), o, "1.4"], check=True, stdout=subprocess.DEVNULL)
    ps = json.load(open(o))["paths"]
    levels.append(" ".join(p["d"] for p in ps))
print("room levels:", N, "paths, ~", sum(len(l) for l in levels) // 1024, "KB; t0", T0, "ratio", RATIO)
groups["roomLevels"] = [{"d": l} for l in levels]
groups["roomLevelsMeta"] = [{"t0": T0, "ratio": RATIO, "n": N}]
os.makedirs(os.path.join(root, "src/app/(site)/lab/hero"), exist_ok=True)
json.dump({"w": 1500, "h": 1200, "groups": groups}, open(os.path.join(root, "src/app/(site)/lab/hero/bed-trace.json"), "w"), separators=(",", ":"))
print("matte bytes", os.path.getsize(os.path.join(root, "public/lab/bed-matte.png")))
