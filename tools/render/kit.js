// Procedural materials, set pieces and furniture builders (units: metres, Y up).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const cv = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
let S = 7;
const rand = () => { S = (S * 1664525 + 1013904223) >>> 0; return S / 4294967296; };
export const seedKit = (n) => { S = n >>> 0; };

/* ------------------------------------------------------------ textures */
const cache = new Map();
function tex(key, make, repeat = [1, 1], srgb = true) {
  const k = key + repeat.join("x");
  if (cache.has(k)) return cache.get(k);
  const c = make();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(k, t); return t;
}
function calm(hex) { // tame saturated seed colours so renders feel natural rather than orange
  const c = new THREE.Color(hex), hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h + 0.012, hsl.s * 0.5, Math.min(0.68, hsl.l * 1.3)); return "#" + c.getHexString();
}
function woodCanvas(hex0) {
  const hex = calm(hex0);
  const w = 1024, h = 512, c = cv(w, h), g = c.getContext("2d");
  g.fillStyle = hex; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 16; i++) { g.fillStyle = rand() > 0.5 ? `rgba(0,0,0,${0.02 + rand() * 0.03})` : `rgba(255,240,210,${0.02 + rand() * 0.03})`; g.fillRect(0, rand() * h, w, 8 + rand() * 60); }
  for (let i = 0; i < 300; i++) {
    const y0 = rand() * h, amp = rand() * 5, fr = 0.002 + rand() * 0.01, ph = rand() * 6.28, ph2 = rand() * 6.28;
    g.strokeStyle = rand() > 0.45 ? `rgba(60,34,14,${0.04 + rand() * 0.07})` : `rgba(255,236,200,${0.03 + rand() * 0.05})`;
    g.lineWidth = 0.5 + rand() * 2.2; g.beginPath();
    for (let x = 0; x <= w; x += 8) { const y = y0 + Math.sin(x * fr + ph) * amp + Math.sin(x * 0.021 + ph2) * 1.5; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  return c;
}
function fabricCanvas(kind) {
  const n = 256, c = cv(n, n), g = c.getContext("2d");
  g.fillStyle = "#808080"; g.fillRect(0, 0, n, n);
  if (kind === "boucle") {
    for (let i = 0; i < 2600; i++) { const x = rand() * n, y = rand() * n, r = 1.5 + rand() * 3; g.fillStyle = rand() > 0.5 ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)"; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill(); }
  } else if (kind === "leatherette") {
    for (let i = 0; i < 1800; i++) { const x = rand() * n, y = rand() * n, r = 2 + rand() * 4; g.fillStyle = `rgba(0,0,0,${0.08 + rand() * 0.18})`; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill(); }
  } else {
    const step = kind === "linen" ? 4 : 2;
    for (let y = 0; y < n; y += step) for (let x = 0; x < n; x += step) {
      const o = ((x / step + y / step) & 1) ? 1 : -1; const v = 128 + o * (kind === "linen" ? 40 : 18) + (rand() - 0.5) * (kind === "linen" ? 40 : 14);
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, step, step);
    }
    if (kind === "linen") for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${rand() * 0.18})`; g.fillRect(0, rand() * n, n, 1); g.fillRect(rand() * n, 0, 1, n); }
  }
  return c;
}
function noiseCanvas(base, amp = 14, size = 512, blobs = 500) {
  const c = cv(size, size), g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < blobs; i++) { const x = rand() * size, y = rand() * size, r = 8 + rand() * 90; const a = (rand() - 0.5) * amp / 255; g.fillStyle = a > 0 ? `rgba(255,250,240,${a * 1.2})` : `rgba(40,30,20,${-a * 1.2})`; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill(); }
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rand() > 0.5 ? 255 : 0},${rand() > 0.5 ? 250 : 0},${rand() > 0.5 ? 240 : 0},.03)`; g.fillRect(rand() * size, rand() * size, 2, 2); }
  return c;
}

/* ----------------------------------------------------------- materials */
export function woodMat(hex, repeat = [1, 1]) {
  const m = tex("wood" + hex, () => woodCanvas(hex), repeat);
  return new THREE.MeshStandardMaterial({ map: m, bumpMap: m, bumpScale: 0.5, roughness: 0.5, metalness: 0 });
}
export function fabricMat(hex, kind = "velvet", repeat = [10, 10]) {
  const b = tex("fab" + kind, () => fabricCanvas(kind), repeat, false);
  if (kind === "velvet") return new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.92, sheen: 1, sheenColor: new THREE.Color(hex).lerp(new THREE.Color("#ffffff"), 0.35), sheenRoughness: 0.5, bumpMap: b, bumpScale: 0.25 });
  if (kind === "leatherette") return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.42, bumpMap: b, bumpScale: 0.6 });
  return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.96, bumpMap: b, bumpScale: kind === "boucle" ? 1.4 : 0.7 });
}
export const plain = (hex, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: hex, roughness: r, metalness: m });
export const brass = () => new THREE.MeshStandardMaterial({ color: "#c9a45c", roughness: 0.32, metalness: 0.7 });
export const mirrorMat = () => new THREE.MeshStandardMaterial({ color: "#e9eeee", roughness: 0.06, metalness: 0.25, emissive: "#9aa6a8", emissiveIntensity: 0.18 });

/* ------------------------------------------------------------- helpers */
const shadowAll = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
const rbox = (w, h, d, r, mat, seg = 4) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), mat); return m; };
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const G = (...c) => { const g = new THREE.Group(); c.forEach((x) => x && g.add(x)); return g; };

/* ------------------------------------------------------------ the room */
const TONES = {
  warm: { wall: "#ebe2d4", floor: "#d9d1c4", sun: 1.0, rug: "#d9d0c0" },
  stone: { wall: "#dddad3", floor: "#c9c4ba", sun: 1.0, rug: "#cfc8bb" },
  sand: { wall: "#e6d8c0", floor: "#d3c4a8", sun: 1.0, rug: "#d6c9b0" },
  dark: { wall: "#3a3835", floor: "#2e2c2a", sun: 0.9, rug: "#4a4640" },
};
export const toneNames = Object.keys(TONES);

/**
 * Room with an arched window (out of frame, on the right) that throws a soft shaft of sunlight.
 * opts: tone, wallZ (back wall distance behind origin), patch (point on floor the sun shaft aims at)
 */
export function room(opts = {}) {
  const t = TONES[opts.tone || "warm"];
  const wallZ = opts.wallZ ?? -1.6, wallX = opts.wallX ?? 3.0, H = 3.6;
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ map: tex("plaster" + t.wall, () => noiseCanvas(t.wall, 9, 512, 260), [10, 2.5]), bumpMap: tex("plasterb", () => noiseCanvas("#808080", 40), [10, 2.5], false), bumpScale: 0.5, roughness: 0.95 });
  const floorMat = new THREE.MeshStandardMaterial({ map: tex("floor" + t.floor, () => noiseCanvas(t.floor, 10, 1024, 500), [16, 16]), bumpMap: tex("floorb", () => noiseCanvas("#808080", 40, 512, 600), [24, 24], false), bumpScale: 0.5, roughness: 0.6 });
  // floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat); floor.rotation.x = -Math.PI / 2; g.add(floor);
  // back wall
  const back = new THREE.Mesh(new THREE.PlaneGeometry(40, H), wallMat); back.position.set(0, H / 2, wallZ); g.add(back);
  // left wall
  const left = new THREE.Mesh(new THREE.PlaneGeometry(40, H), wallMat); left.rotation.y = Math.PI / 2; left.position.set(-8, H / 2, 0); g.add(left);
  // ceiling (not in frame)
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), wallMat); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; g.add(ceil);
  // right wall with arched window
  const sunDir = V(0.55, opts.sunElev ?? 0.22, 0.8).normalize();
  const patch = opts.patch || V(1.1, 1.2, wallZ);
  const tt = (wallX - patch.x) / sunDir.x;
  const win = { y: patch.y + sunDir.y * tt, z: patch.z + sunDir.z * tt };
  const ww = opts.winW ?? 1.15, wh = opts.winH ?? 2.1;
  const sh = new THREE.Shape(); sh.moveTo(-30, 0); sh.lineTo(30, 0); sh.lineTo(30, H); sh.lineTo(-30, H); sh.lineTo(-30, 0);
  const hole = new THREE.Path();
  const y0 = win.y - wh / 2, y1 = win.y + wh / 2 - ww / 2;
  hole.moveTo(win.z - ww / 2, y0); hole.lineTo(win.z + ww / 2, y0); hole.lineTo(win.z + ww / 2, y1);
  hole.absarc(win.z, y1, ww / 2, 0, Math.PI, false); hole.lineTo(win.z - ww / 2, y0);
  sh.holes.push(hole);
  const rg = new THREE.ShapeGeometry(sh, 24); rg.rotateY(-Math.PI / 2);
  const rwall = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: t.wall, roughness: 0.95, side: THREE.DoubleSide })); rwall.position.x = wallX;
  rwall.material.shadowSide = THREE.DoubleSide; g.add(rwall);
  shadowAll(g); floor.castShadow = false; back.castShadow = false; left.castShadow = false; ceil.castShadow = false;
  rwall.castShadow = true;
  const target = V(0, 0.6, wallZ + 1.0);
  const lights = {
    target, shadowRadius: opts.shadowRadius ?? 9,
    sunDir, sunColor: new THREE.Color("#ffd9a8"), sunIntensity: (opts.sun ?? 3.8) * t.sun, sunAngle: 0.025,
    skyColor: new THREE.Color("#bcd2ff"), skyIntensity: (opts.sky ?? 1.05) * (opts.tone === "dark" ? 0.6 : 1),
    fillColor: new THREE.Color("#fff0dd"), fillIntensity: opts.fill ?? 0.3, skyFill: "#dfe8ff", groundFill: "#e0cdaa", hemiIntensity: opts.hemi ?? 0.3, aoIntensity: opts.ao ?? 2.1, aoColor: new THREE.Color("#fbf3e8"),
    skySample(rnd, out) {
      const z = win.z + (rnd() - 0.5) * ww, y = win.y + (rnd() - 0.5) * (wh - 0.2);
      out.set(wallX, y, z).sub(target).normalize(); return out;
    },
    grade: opts.grade || { r: 1.02, g: 1.0, b: 0.97 },
  };
  return { group: g, lights, wallZ, wallX, tone: t };
}

/* ------------------------------------------------------------- props */
export function rug(w, d, hex, z = 0, x = 0) {
  const m = rbox(w, 0.014, d, 0.006, new THREE.MeshStandardMaterial({ color: hex, roughness: 1, bumpMap: tex("fabboucle", () => fabricCanvas("boucle"), [14, 10], false), bumpScale: 1.2 }), 2);
  return at(m, x, 0.008, z);
}
export function vase(h = 0.32, hex = "#e9e2d4", stems = true) {
  const pts = [[0.0, 0], [0.07, 0], [0.095, 0.08 * h / 0.32], [0.075, 0.5 * h], [0.04, 0.8 * h], [0.05, h], [0.04, h]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), plain(hex, 0.55));
  const g = G(body);
  if (stems) for (let i = 0; i < 7; i++) {
    const len = 0.5 + rand() * 0.35; const s = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, len, 5), plain("#8a7550", 0.9));
    s.position.set((rand() - 0.5) * 0.05, h + len / 2 - 0.05, (rand() - 0.5) * 0.05); s.rotation.set((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.014 + rand() * 0.01, 8, 6), plain("#b99a64", 0.9)); head.position.y = len / 2;
    s.add(head); g.add(s);
  }
  return g;
}
export function floorLamp(x, z, h = 1.55) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, h, 12), brass()); pole.position.y = h / 2;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.025, 32), brass()); foot.position.y = 0.0125;
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 0.26, 40, 1, true), new THREE.MeshStandardMaterial({ color: "#efe6d4", roughness: 0.9, side: THREE.DoubleSide, emissive: "#fff1d0", emissiveIntensity: 0.25 })); shade.position.y = h + 0.05;
  return at(G(pole, foot, shade), x, 0, z);
}
export function artPanel(w, h, palette = ["#c9876a", "#e9e0cf", "#40403c"], x = 0, y = 1.6, z = -1.58) {
  const g = G(rbox(w + 0.04, h + 0.04, 0.03, 0.004, plain("#2a2826", 0.6), 2));
  g.add(at(box(w, h, 0.004, plain(palette[1], 0.9)), 0, 0, 0.017));
  const arch = new THREE.Shape(); const r = w * 0.28; arch.moveTo(-r, -h * 0.3); arch.lineTo(r, -h * 0.3); arch.lineTo(r, h * 0.05); arch.absarc(0, h * 0.05, r, 0, Math.PI, false); arch.lineTo(-r, -h * 0.3);
  g.add(at(new THREE.Mesh(new THREE.ShapeGeometry(arch), plain(palette[0], 0.9)), 0, 0, 0.021));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(w * 0.09, 40), plain(palette[2], 0.9)), w * 0.18, h * 0.28, 0.022));
  return at(g, x, y, z);
}
export function books(x, y, z) {
  const g = G(); let yy = 0;
  [["#d9d2c2", 0.22, 0.03], ["#3b3a37", 0.2, 0.025], ["#b5694b", 0.21, 0.02]].forEach(([c, w, h], i) => { g.add(at(rbox(w, h, 0.15, 0.003, plain(c, 0.7), 2), (i % 2) * 0.01, yy + h / 2, 0)); yy += h; });
  return at(g, x, y, z);
}
export function sideTable(x, z, wood, h = 0.5, r = 0.23) {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 48), woodMat(wood, [1, 1])); top.position.y = h;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 20), woodMat(wood)); leg.position.y = h / 2;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.02, 40), woodMat(wood)); base.position.y = 0.01;
  return at(G(top, leg, base), x, 0, z);
}

/* ----------------------------------------------------------- furniture */
export function legSet(kind, w, d, wood, h, inset = 0.07) {
  const g = G(); const xs = [-w / 2 + inset, w / 2 - inset], zs = [-d / 2 + inset, d / 2 - inset];
  for (const x of xs) for (const z of zs) {
    let m;
    if (kind === "metal") { m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, h, 12), brass()); m.position.set(x, h / 2, z); }
    else if (kind === "block") { m = box(0.06, h, 0.06, woodMat(wood, [0.2, 1])); m.position.set(x, h / 2, z); }
    else { m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.017, h, 20), woodMat(wood, [0.2, 1])); m.position.set(x, h / 2, z); m.rotation.z = Math.sign(-x) * 0.1; m.rotation.x = -Math.sign(-z) * 0.1; }
    g.add(m);
  }
  return g;
}

function sofaModule({ seats, fabric, ft, wood, legs = "tapered", cushions = "fixed", noBack = false, leftArm = true, rightArm = true, seatW = 0.62, depth = 0.95, scale = 1 }) {
  const mat = fabricMat(fabric, ft), dark = fabricMat(new THREE.Color(fabric).multiplyScalar(0.86).getStyle(), ft);
  const aw = 0.15, innerW = seats * seatW, W = innerW + (leftArm ? aw : 0.03) + (rightArm ? aw : 0.03);
  const legH = legs === "metal" ? 0.17 : 0.14, baseH = 0.2, g = G();
  g.add(at(legSet(legs, W, depth, wood, legH, 0.09), 0, 0, 0));
  g.add(at(rbox(W, baseH, depth - 0.04, 0.03, dark), 0, legH + baseH / 2, 0));
  const seatTop = legH + baseH;
  const x0 = -W / 2 + (leftArm ? aw : 0.03);
  for (let i = 0; i < seats; i++) g.add(at(rbox(seatW - 0.012, 0.17, depth - 0.2, 0.065, mat, 6), x0 + seatW * (i + 0.5), seatTop + 0.085, 0.07));
  if (!noBack) {
    const backH = 0.5;
    if (cushions === "loose") {
      g.add(at(rbox(innerW, backH + 0.1, 0.16, 0.05, dark), x0 + innerW / 2, seatTop + backH / 2 + 0.1, -depth / 2 + 0.1));
      for (let i = 0; i < seats; i++) { const c = rbox(seatW - 0.04, 0.44, 0.2, 0.09, mat, 6); c.position.set(x0 + seatW * (i + 0.5), seatTop + 0.4, -depth / 2 + 0.26); c.rotation.x = -0.2; c.rotation.z = (i % 2 ? 1 : -1) * 0.025; g.add(c); }
    } else {
      const back = rbox(innerW + 0.02, backH + 0.12, 0.24, 0.08, mat, 6); back.position.set(x0 + innerW / 2, seatTop + backH / 2 + 0.12, -depth / 2 + 0.14); back.rotation.x = -0.12; g.add(back);
      if (cushions === "tufted") for (let i = 0; i < seats * 2; i++) for (const yy of [0.3, 0.52]) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), dark); b.position.set(x0 + 0.155 + i * (seatW / 2), seatTop + yy, -depth / 2 + 0.265 - yy * 0.1); g.add(b);
        for (const dx of [-1, 1]) { const crease = box(0.003, 0.14, 0.01, dark); crease.position.set(b.position.x + dx * 0.0, b.position.y - 0.0, b.position.z + 0.0); }
      }
    }
  }
  if (leftArm) g.add(at(rbox(aw, 0.46, depth - 0.02, 0.06, mat, 6), -W / 2 + aw / 2, seatTop + 0.16, 0));
  if (rightArm) g.add(at(rbox(aw, 0.46, depth - 0.02, 0.06, mat, 6), W / 2 - aw / 2, seatTop + 0.16, 0));
  g.scale.setScalar(scale); g.userData.width = W * scale;
  return g;
}
export function sofa({ layout = "three", fabric = "#b3aa9b", ft = "linen", wood = "#6e4a2f", legs = "tapered", cushions = "fixed", throwPillows = true }) {
  const parts = {
    one: [{ s: 1 }], two: [{ s: 2 }], three: [{ s: 3 }], five: [{ s: 1 }, { s: 3 }, { s: 1 }], seven: [{ s: 1 }, { s: 3 }, { s: 2 }, { s: 1 }],
    lshape: [{ s: 3, ra: false }, { s: 1, chaise: true }],
  }[layout] || [{ s: 3 }];
  const g = G(); const gap = layout === "lshape" ? 0 : 0.1; const mods = [];
  parts.forEach((p) => {
    if (p.chaise) { mods.push({ g: sofaModule({ seats: 1, fabric, ft, wood, legs, cushions: "fixed", noBack: true, leftArm: false, rightArm: true, seatW: 0.8, depth: 1.62 }), chaise: true }); }
    else mods.push({ g: sofaModule({ seats: p.s, fabric, ft, wood, legs, cushions, rightArm: p.ra !== false }) });
  });
  const total = mods.reduce((a, m) => a + m.g.userData.width, 0) + gap * (mods.length - 1);
  let x = -total / 2;
  mods.forEach((m) => { const w = m.g.userData.width; m.g.position.x = x + w / 2; if (m.chaise) m.g.position.z = 0.335; x += w + gap; g.add(m.g); });
  if (throwPillows) {
    const p1 = rbox(0.4, 0.38, 0.14, 0.06, fabricMat(layout === "seven" || layout === "five" ? "#c9876a" : "#e6dccb", "linen"), 5);
    p1.position.set(-total / 2 + 0.5, 0.68, -0.1); p1.rotation.set(-0.15, 0.25, 0.05); g.add(p1);
  }
  g.userData.width = total;
  return g;
}
/** Sofa-cum-bed in its opened (bed) state. Illustrative: the mechanism itself is not modelled. */
export function sofaBedOpen({ fabric = "#4a4846", ft = "leatherette", wood = "#6e4a2f", sleeper = "double" }) {
  const g = G(); const W = sleeper === "double" ? 1.5 : 1.05, L = 1.95, legH = 0.14;
  const mat = fabricMat(fabric, ft), dark = fabricMat(new THREE.Color(fabric).multiplyScalar(0.85).getStyle(), ft);
  g.add(at(legSet("block", W + 0.3, L, wood, legH, 0.08), 0, 0, 0));
  g.add(at(rbox(W + 0.3, 0.2, L, 0.03, dark), 0, legH + 0.1, 0));
  g.add(at(rbox(W, 0.2, L - 0.14, 0.07, mat, 6), 0, legH + 0.3, 0.04));
  for (const sx of [-1, 1]) g.add(at(rbox(0.15, 0.46, L - 0.2, 0.06, mat, 6), sx * (W / 2 + 0.075), legH + 0.33, -0.05));
  g.add(at(rbox(W + 0.3, 0.55, 0.22, 0.07, mat, 6), 0, legH + 0.6, -L / 2 + 0.12));
  for (let i = 0; i < 2; i++) { const c = rbox(W / 2 - 0.05, 0.36, 0.18, 0.08, fabricMat("#e6dccb", "linen"), 6); c.position.set((i ? 1 : -1) * (W / 4), legH + 0.62, -L / 2 + 0.32); c.rotation.x = -0.25; g.add(c); }
  g.add(at(rbox(W * 0.92, 0.04, 0.5, 0.02, fabricMat("#c9876a", "boucle", [8, 4]), 3), 0, legH + 0.42, L / 2 - 0.4));
  g.userData.width = W + 0.3; return g;
}
export function armchair(opts) { const g = sofaModule({ seats: 1, seatW: 0.72, depth: 0.95, fabric: opts.fabric, ft: opts.ft || "velvet", wood: opts.wood, legs: opts.legs || "tapered", cushions: "fixed" }); return G(g); }

export function bed({ size = "queen", headboard = "panel", storage = "none", wood = "#a8692f", fabric = "#b3aa9b", ft = "linen", low = false, bedding = "#e8e1d3", throwHex = "#8b967f" }) {
  const dims = { single: [1.0, 2.0], double: [1.4, 2.0], queen: [1.6, 2.05], king: [1.8, 2.05] }[size] || [1.6, 2.05];
  const [W, L] = dims; const g = G(); const baseH = low ? 0.34 : storage !== "none" ? 0.3 : 0.2, legH = low ? 0.04 : 0.14;
  const wmat = () => woodMat(wood, [1.2, 0.4]);
  if (low) {
    g.add(at(rbox(W + 0.06, baseH, L + 0.04, 0.02, fabricMat(fabric, ft, [14, 14])), 0, legH + baseH / 2, 0));
    g.add(at(rbox(W + 0.02, 0.05, L - 0.1, 0.01, wmat()), 0, 0.025, 0));
  } else {
    g.add(at(rbox(W + 0.08, baseH, L + 0.06, 0.02, wmat()), 0, legH + baseH / 2, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(box(0.07, legH, 0.07, wmat()), sx * (W / 2 - 0.02), legH / 2, sz * (L / 2 - 0.02)));
    if (storage === "drawers") for (let i = 0; i < 2; i++) { const dw = (W - 0.12) / 2; g.add(at(rbox(dw, baseH - 0.08, 0.012, 0.004, wmat(), 2), -W / 2 + 0.06 + dw / 2 + i * (dw + 0.02), legH + baseH / 2, L / 2 + 0.036)); g.add(at(rbox(0.12, 0.012, 0.014, 0.004, brass(), 2), -W / 2 + 0.06 + dw / 2 + i * (dw + 0.02), legH + baseH / 2, L / 2 + 0.046)); }
    if (storage === "lift") g.add(at(box(W + 0.085, 0.006, L + 0.065, plain("#000", 1)), 0, legH + baseH - 0.01, 0));
  }
  const m0 = g.children.length;
  const top = legH + baseH;
  g.add(at(rbox(W - 0.02, 0.24, L - 0.06, 0.07, plain("#efe9dc", 0.9), 5), 0, top + 0.12, 0.01));
  g.add(at(rbox(W + 0.1, 0.3, L * 0.66, 0.1, fabricMat(bedding, "linen", [12, 12]), 6), 0, top + 0.17, L * 0.17));
  g.add(at(rbox(W * 0.94, 0.05, 0.38, 0.02, fabricMat(throwHex, "boucle", [8, 4]), 4), 0, top + 0.345, L * 0.42));
  const m1 = g.children.length;
  const np = W > 1.2 ? 2 : 1;
  for (let i = 0; i < np; i++) { const pw = np === 2 ? W / 2 - 0.1 : 0.62; const p = rbox(pw, 0.15, 0.46, 0.07, fabricMat("#f0eadd", "linen"), 6); p.position.set(np === 2 ? (i ? 1 : -1) * (W / 4) : 0, top + 0.31, -L / 2 + 0.34); p.rotation.x = -0.28; g.add(p); }
  if (W > 1.2) { const p = rbox(0.5, 0.11, 0.3, 0.05, fabricMat(throwHex, "linen"), 5); p.position.set(0.12, top + 0.4, -L / 2 + 0.48); p.rotation.set(-0.5, 0.15, 0); g.add(p); }
  const m2 = g.children.length;
  // headboard
  const hbTop = low ? 0.78 : headboard === "arched" ? 1.5 : 1.2, hz = -L / 2 - 0.06;
  const hbH = hbTop - 0.1;
  if (headboard === "panel" || low) {
    g.add(at(rbox(W + 0.14, hbH, 0.08, 0.02, low ? fabricMat(fabric, ft, [16, 12]) : wmat()), 0, 0.1 + hbH / 2, hz));
    if (!low) g.add(at(rbox(W - 0.1, hbH - 0.3, 0.02, 0.01, woodMat(new THREE.Color(wood).multiplyScalar(0.8).getStyle(), [1, 0.5])), 0, 0.1 + hbH / 2 + 0.02, hz + 0.045));
  } else if (headboard === "slatted") {
    const n = Math.round((W + 0.1) / 0.075);
    g.add(at(box(W + 0.14, 0.05, 0.07, wmat()), 0, 0.1 + 0.03, hz));
    const topRail = at(box(W + 0.14, 0.07, 0.07, wmat()), 0, 0.1 + hbH - 0.02, hz); topRail.userData.rail = true; g.add(topRail);
    g.add(at(box(W + 0.1, hbH - 0.1, 0.012, plain("#1c1613", 1)), 0, 0.1 + hbH / 2, hz - 0.045));
    for (let i = 0; i < n; i++) { const sl = at(rbox(0.04, hbH - 0.1, 0.05, 0.008, wmat(), 2), -W / 2 - 0.02 + ((i + 0.5) * (W + 0.04)) / n, 0.1 + hbH / 2, hz); sl.userData.slat = true; g.add(sl); }
  } else if (headboard === "arched") {
    const shp = new THREE.Shape(); const hw = (W + 0.14) / 2, ys = hbH - hw;
    shp.moveTo(-hw, 0); shp.lineTo(hw, 0); shp.lineTo(hw, ys); shp.absarc(0, ys, hw, 0, Math.PI, false); shp.lineTo(-hw, 0);
    const geo = new THREE.ExtrudeGeometry(shp, { depth: 0.08, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 40 });
    geo.translate(0, 0, -0.04); const m = new THREE.Mesh(geo, wmat()); m.position.set(0, 0.1, hz); g.add(m);
  } else if (headboard === "upholstered") {
    const fm = fabricMat(fabric, ft, [16, 12]);
    g.add(at(rbox(W + 0.14, hbH, 0.14, 0.06, fm, 6), 0, 0.1 + hbH / 2, hz));
    const n = Math.max(3, Math.round(W / 0.4));
    for (let i = 1; i < n; i++) g.add(at(box(0.006, hbH - 0.2, 0.006, fabricMat(new THREE.Color(fabric).multiplyScalar(0.7).getStyle(), ft)), -W / 2 - 0.07 + ((i) * (W + 0.14)) / n, 0.1 + hbH / 2, hz + 0.07));
  }
  g.userData = { width: W + 0.14, depth: L };
    // part tags for the matte / ID passes (tools/render/matte.cjs)
  g.children.forEach((c, k) => { if (c.userData.slat) return; c.userData.part = k < m0 ? "frame" : k < m0 + 2 ? "bedding" : k < m1 ? "throw" : k < m2 ? "pillow" : "head"; });
  return g;
}

function chairObj({ wood, kind = "wood", fabric = "#8b967f", ft = "linen", s = 1 }) {
  const g = G(); const wm = () => woodMat(wood, [0.3, 1]);
  const seatH = 0.46;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.014, seatH, 14), wm()); lg.position.set(sx * 0.2, seatH / 2, sz * 0.19); lg.rotation.set(sz * 0.05, 0, -sx * 0.06); g.add(lg);
  }
  if (kind === "upholstered") g.add(at(rbox(0.46, 0.07, 0.44, 0.03, fabricMat(fabric, ft), 4), 0, seatH + 0.03, 0)); else g.add(at(rbox(0.46, 0.035, 0.44, 0.012, wm(), 3), 0, seatH + 0.015, 0));
  for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.015, 0.5, 14), wm()); post.position.set(sx * 0.2, seatH + 0.25, -0.2); post.rotation.x = -0.1; g.add(post); }
  if (kind === "upholstered") { const bk = rbox(0.42, 0.28, 0.06, 0.03, fabricMat(fabric, ft), 4); bk.position.set(0, seatH + 0.34, -0.225); bk.rotation.x = -0.1; g.add(bk); }
  else { for (let i = 0; i < 3; i++) { const sl = rbox(0.4, 0.05, 0.02, 0.008, wm(), 2); sl.position.set(0, seatH + 0.22 + i * 0.1, -0.215 - i * 0.012); sl.rotation.x = -0.1; g.add(sl); } }
  g.scale.setScalar(s); return g;
}
export function diningChair(o) { return chairObj(o); }

export function dining({ shape = "rectangular", capacity = 6, chairs = "wood", wood = "#a8692f", fabric = "#8b967f", ft = "linen", chairWood }) {
  const g = G(); const h = 0.75, th = 0.045; const wm = (r) => woodMat(wood, r || [1.4, 0.6]);
  const per = Math.max(1, Math.floor(capacity / 2));
  let spots = [];
  if (shape === "round" || shape === "oval") {
    const rx = shape === "round" ? (capacity >= 6 ? 0.72 : 0.56) : capacity >= 8 ? 1.2 : capacity >= 6 ? 1.0 : 0.85, rz = shape === "round" ? rx : rx * 0.52;
    const profile = [[0, 0], [1, 0], [1, 0.8], [0.985, 1]].map(([a, b]) => new THREE.Vector2(a * 1, b * th));
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, th, 72), wm([1.5, 1.5])); top.scale.set(rx, 1, rz); top.position.y = h - th / 2; g.add(top);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, h - th, 40), wm([0.5, 1])); ped.position.y = (h - th) / 2; g.add(ped);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.34 * Math.min(1, rz / 0.5), 0.34 * Math.min(1, rz / 0.5), 0.03, 48), wm()); foot.position.y = 0.015; g.add(foot);
    const n = capacity;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.PI / n * (n % 2 ? 0 : 1); spots.push({ x: Math.sin(a) * (rx + 0.1), z: Math.cos(a) * (rz + 0.1), r: a + Math.PI }); }
  } else {
    const [W, D] = shape === "square" ? [0.95, 0.95] : capacity >= 8 ? [2.4, 1.0] : capacity >= 6 ? [1.9, 0.95] : [1.4, 0.85];
    g.add(at(rbox(W, th, D, 0.012, wm(), 3), 0, h - th / 2, 0));
    g.add(at(rbox(W - 0.12, 0.08, D - 0.12, 0.01, wm([1, 0.3]), 2), 0, h - th - 0.04, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, h - th, 4), wm([0.3, 1])); lg.rotation.y = Math.PI / 4; lg.position.set(sx * (W / 2 - 0.08), (h - th) / 2, sz * (D / 2 - 0.08)); g.add(lg); }
    const perSide = shape === "square" ? 1 : per;
    for (let i = 0; i < perSide; i++) { const x = (-W / 2 + (W * (i + 0.5)) / perSide) * (shape === "square" ? 0 : 1); spots.push({ x, z: D / 2 + 0.12, r: Math.PI }); spots.push({ x, z: -D / 2 - 0.12, r: 0 }); }
    if (shape === "square") { spots.push({ x: W / 2 + 0.12, z: 0, r: -Math.PI / 2 }); spots.push({ x: -W / 2 - 0.12, z: 0, r: Math.PI / 2 }); }
  }
  if (chairs !== "none") spots.forEach((p, i) => { const c = chairObj({ wood: chairWood || wood, kind: chairs === "upholstered" ? "upholstered" : "wood", fabric, ft, s: 1 }); c.position.set(p.x, 0, p.z); c.rotation.y = p.r + (i % 2 ? 0.04 : -0.04); g.add(c); });
  return g;
}

export function dressing({ wood = "#a8692f" }) {
  const g = G(); const wm = (r) => woodMat(wood, r || [1, 0.5]);
  g.add(at(rbox(1.1, 0.04, 0.46, 0.01, wm(), 3), 0, 0.74, 0));
  g.add(at(rbox(1.06, 0.2, 0.42, 0.008, wm(), 2), 0, 0.62, 0));
  for (let i = 0; i < 3; i++) { const w = i === 1 ? 0.4 : 0.31; const x = i === 0 ? -0.36 : i === 1 ? 0 : 0.36; g.add(at(rbox(w, 0.15, 0.012, 0.004, wm([0.6, 0.4]), 2), x, 0.62, 0.225)); g.add(at(rbox(0.09, 0.012, 0.016, 0.004, brass(), 2), x, 0.62, 0.236)); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.016, 0.52, 18), wm([0.2, 1])); l.position.set(sx * 0.49, 0.26, sz * 0.18); l.rotation.set(sz * 0.05, 0, -sx * 0.06); g.add(l); }
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 20, 64), wm()); frame.scale.set(0.85, 1, 1); frame.position.set(0, 1.28, -0.16); g.add(frame);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 64), mirrorMat()); disc.scale.set(0.85, 1, 1); disc.position.set(0, 1.28, -0.155); g.add(disc);
  g.add(at(rbox(0.04, 0.5, 0.03, 0.01, wm(), 2), 0, 0.95, -0.19));
  const tray = rbox(0.28, 0.012, 0.18, 0.005, brass(), 2); g.add(at(tray, 0.3, 0.766, 0.02));
  g.add(at(vase(0.14, "#e9e2d4", false), -0.32, 0.76, 0.03));
  return g;
}
export function centreTable({ wood = "#a8692f" }) {
  const g = G(); const wm = (r) => woodMat(wood, r || [1.4, 1.4]);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 64), wm()); top.position.y = 0.4; g.add(top);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.4; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.018, 0.4, 18), wm([0.2, 1])); l.position.set(Math.sin(a) * 0.3, 0.2, Math.cos(a) * 0.3); l.rotation.set(Math.cos(a) * 0.16, 0, -Math.sin(a) * 0.16); g.add(l); }
  g.add(at(books(0, 0, 0), -0.1, 0.42, 0.04)); g.add(at(vase(0.16, "#d9d2c2", false), 0.2, 0.42, -0.1));
  return g;
}
export function stool({ wood = "#b98a52" }) {
  const g = G(); const wm = (r) => woodMat(wood, r || [1, 1]);
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.045, 48), wm()); seat.position.y = 0.45; g.add(seat);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.014, 0.46, 16), wm([0.2, 1])); l.position.set(Math.sin(a) * 0.13, 0.225, Math.cos(a) * 0.13); l.rotation.set(Math.cos(a) * 0.12, 0, -Math.sin(a) * 0.12); g.add(l); }
  return g;
}
export function mattress() {
  const g = G(); const wm = woodMat("#b98a52", [1.5, 0.5]);
  g.add(at(rbox(1.62, 0.12, 2.08, 0.02, wm, 2), 0, 0.14, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(box(0.08, 0.08, 0.08, wm), sx * 0.75, 0.04, sz * 1.0));
  g.add(at(rbox(1.56, 0.28, 2.02, 0.07, plain("#f1ede3", 0.95), 6), 0, 0.34, 0));
  g.add(at(rbox(1.575, 0.05, 2.035, 0.02, plain("#4a4845", 0.9), 3), 0, 0.3, 0));
  g.add(at(rbox(1.575, 0.012, 2.035, 0.005, plain("#e0dacb", 0.9), 2), 0, 0.2, 0));
  for (let i = 0; i < 7; i++) g.add(at(box(1.4, 0.004, 0.006, plain("#d8d1c2", 1)), 0, 0.482, -0.9 + i * 0.3));
  return g;
}

export { V, G, at, box, rbox, shadowAll };

/* ------------------------------------------------- workshop-process props */
export function endGrainMat(hex = "#b98a52") {
  const t = tex("endgrain" + hex, () => {
    const n = 512, c = cv(n, n), g = c.getContext("2d");
    g.fillStyle = calm(hex); g.fillRect(0, 0, n, n);
    for (let i = 0; i < 38; i++) { const r = (i / 38) * n * 0.5 + rand() * 3; g.strokeStyle = `rgba(70,40,15,${0.05 + rand() * 0.18})`; g.lineWidth = 1 + rand() * 3; g.beginPath(); g.ellipse(n / 2 + (rand() - 0.5) * 6, n / 2 + (rand() - 0.5) * 6, r, r * (0.92 + rand() * 0.1), 0, 0, 6.28); g.stroke(); }
    for (let i = 0; i < 20; i++) { g.strokeStyle = "rgba(60,30,10,.12)"; g.lineWidth = 1; g.beginPath(); const a = rand() * 6.28; g.moveTo(n / 2, n / 2); g.lineTo(n / 2 + Math.cos(a) * n / 2, n / 2 + Math.sin(a) * n / 2); g.stroke(); }
    return c;
  });
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
}
export function log(len, rad, hex = "#b98a52") {
  const bark = new THREE.MeshStandardMaterial({ color: "#4b3a2a", roughness: 0.97, bumpMap: tex("fabboucle", () => fabricCanvas("boucle"), [6, 2], false), bumpScale: 2 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 1.04, len, 40), [bark, endGrainMat(hex), endGrainMat(hex)]);
  m.rotation.z = Math.PI / 2; return G(m);
}
export function plank(L, Wd, T, hex, mat) { return rbox(L, T, Wd, 0.004, mat || woodMat(hex, [2, 0.5]), 2); }
export function workbench(wood = "#9a7a52") {
  const g = G(); const wm = woodMat(wood, [2, 1]);
  g.add(at(rbox(2.6, 0.08, 0.85, 0.01, wm, 2), 0, 0.86, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(box(0.08, 0.82, 0.08, wm), sx * 1.2, 0.41, sz * 0.36));
  g.add(at(box(2.4, 0.05, 0.05, wm), 0, 0.3, 0.36)); g.add(at(box(2.4, 0.05, 0.05, wm), 0, 0.3, -0.36));
  return g;
}
export function handSaw() {
  const g = G();
  const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.lineTo(0.55, 0); shp.lineTo(0.55, 0.045); shp.lineTo(0.0, 0.1); shp.lineTo(0, 0);
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, { depth: 0.0015, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: "#aeb3b6", roughness: 0.35, metalness: 0.6 }));
  g.add(blade);
  const handle = rbox(0.13, 0.12, 0.028, 0.02, woodMat("#6b4a2e"), 3); handle.position.set(-0.07, 0.07, 0.01); g.add(handle);
  return g;
}
export function barClamp(len = 0.9) {
  const m = new THREE.MeshStandardMaterial({ color: "#8f9498", roughness: 0.4, metalness: 0.6 });
  const g = G(at(box(len, 0.018, 0.008, m), 0, 0, 0));
  g.add(at(box(0.04, 0.07, 0.03, new THREE.MeshStandardMaterial({ color: "#a33b25", roughness: 0.5 })), -len / 2, 0, 0));
  g.add(at(box(0.04, 0.07, 0.03, new THREE.MeshStandardMaterial({ color: "#a33b25", roughness: 0.5 })), len / 2 - 0.15, 0, 0));
  g.add(at(rbox(0.018, 0.09, 0.018, 0.005, plain("#2b2c2e", 0.5), 2), len / 2 - 0.15, 0.06, 0));
  return g;
}
export function brush() {
  const g = G(); g.add(at(rbox(0.2, 0.026, 0.026, 0.01, woodMat("#7a5a3a"), 3), -0.1, 0, 0));
  g.add(at(box(0.03, 0.03, 0.03, plain("#b8bcbf", 0.3, 0.7)), 0.02, 0, 0));
  g.add(at(rbox(0.05, 0.03, 0.03, 0.01, plain("#2c2420", 0.9), 2), 0.055, 0, 0));
  return g;
}
export function tin(h = 0.11, r = 0.07, label = "#c9a45c") {
  const g = G(); g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), new THREE.MeshStandardMaterial({ color: "#c7c9c8", roughness: 0.35, metalness: 0.7 })), 0, h / 2, 0));
  g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(r + 0.001, r + 0.001, h * 0.45, 40), plain(label, 0.6)), 0, h * 0.5, 0));
  return g;
}
export function fabricBolt(hex, h, r = 0.085, ft = "linen") {
  const g = G(); g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), fabricMat(hex, ft, [6, 3])), 0, h / 2, 0));
  g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.28, r * 0.28, h + 0.03, 20), plain("#d9cdb4", 0.9)), 0, h / 2, 0));
  return g;
}
export function swatchFan(colors) {
  const g = G(); colors.forEach((c, i) => { const s = rbox(0.09, 0.004, 0.32, 0.002, fabricMat(c, i % 2 ? "linen" : "boucle", [3, 6]), 2); s.geometry.translate(0, 0, 0.14); s.rotation.y = -0.7 + i * 0.22; s.position.y = i * 0.0045; g.add(s); });
  g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 16), brass()), 0, 0.02, 0));
  return g;
}
export function foamSlab(w, d, t, hex = "#f0e2b3") { return rbox(w, t, d, 0.012, new THREE.MeshStandardMaterial({ color: hex, roughness: 1, bumpMap: tex("fabboucle", () => fabricCanvas("boucle"), [10, 6], false), bumpScale: 1.6 }), 3); }
