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
os.makedirs(os.path.join(root, "public/lab"), exist_ok=True)
down(union).save(os.path.join(root, "public/lab/bed-matte.png"), optimize=True)

groups = {}
eps = {"slat": 0.8, "head": 0.7, "frame": 0.6, "bedding": 0.5, "throw": 0.5, "pillow": 0.5}
for k, im in masks.items():
    p = os.path.join(tmp, k + ".png"); im.save(p)
    o = os.path.join(tmp, k + ".json")
    subprocess.run([sys.executable, os.path.join(root, "tools/render/trace-matte.py"), p, o, str(eps[k])], check=True, stdout=subprocess.DEVNULL)
    groups[k] = json.load(open(o))["paths"]
    print(k, len(groups[k]), "contours")
os.makedirs(os.path.join(root, "src/app/(site)/lab/hero"), exist_ok=True)
json.dump({"w": 1500, "h": 1200, "groups": groups}, open(os.path.join(root, "src/app/(site)/lab/hero/bed-trace.json"), "w"), separators=(",", ":"))
print("matte bytes", os.path.getsize(os.path.join(root, "public/lab/bed-matte.png")))
