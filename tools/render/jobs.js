import * as THREE from "three";
import * as K from "./kit.js";
const { V, G, at, box, rbox, shadowAll, plain } = K;

function stage(o) {
  const scene = new THREE.Scene();
  // keep the (invisible) window wall behind the camera, however wide the shot is
  const wallX = Math.max(3.0, (o.cam ? o.cam[0] : 0) + 1.6);
  const r = K.room({ wallX, tone: o.tone, wallZ: o.wallZ ?? -1.5, patch: o.patch, sun: o.sun, sky: o.sky, fill: o.fill, hemi: o.hemi, sunElev: o.sunElev, grade: o.grade, winW: o.winW, winH: o.winH });
  scene.add(r.group);
  const item = o.item; item.rotation.y = o.rot ?? 0; item.position.set(...(o.pos || [0, 0, 0])); scene.add(K.shadowAll(item));
  if (o.props) o.props(scene, r);
  if (o.exposure) r.lights.__exposure = o.exposure;
  const cam = new THREE.PerspectiveCamera(o.fov ?? 30, o.w / o.h, 0.1, 80);
  cam.position.set(...o.cam); cam.lookAt(...o.look);
  return { scene, camera: cam, lights: r.lights };
}
const add = (scene, ...objs) => objs.forEach((o) => scene.add(K.shadowAll(o)));

/* ---------- palettes (mirrors the app's seed colours) ---------- */
const W = { natural: "#b98a52", honey: "#a8692f", walnut: "#6e4a2f", espresso: "#3b2a20", ash: "#b8ad9c", light: "#c9a26d" };
const F = { ivory: "#e6dccb", stone: "#b3aa9b", sage: "#8b967f", terracotta: "#b5694b", navy: "#34425a", charcoal: "#4a4846" };

/* ---------- helpers ---------- */
export const JOBS = {};
const job = (name, w, h, fn, q = {}) => { JOBS[name] = { name, width: w, height: h, build: () => fn(w, h), ...q }; };
/** Place the camera so a W×H box centred on `target` fills the frame (3/4 view). */
function frame(w, h, W, H, target, yaw = 0.45, pitch = 0.12, fov = 28, margin = 1.22) {
  const t = Math.tan((fov * Math.PI) / 360), asp = w / h;
  const d = Math.max((W * margin) / (2 * t * asp), (H * margin) / (2 * t));
  const p = V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(d).add(V(...target));
  return { cam: [p.x, p.y, p.z], look: target, fov };
}
const PW = 1500, PH = 1200;
const decor = (s, wood, { lamp = false, vase: v = true, rugHex, rugW = 3, rugD = 2, x = 0, z = 0 } = {}) => {
  if (rugHex) add(s, K.rug(rugW, rugD, rugHex, z, x));
};

/* ---------- hero + showroom ---------- */
job("hero", 1800, 1500, (w, h) => stage({
  w, h, tone: "warm", wallZ: -1.55, patch: V(1.0, 1.2, -1.55), exposure: 1.65, ...frame(w, h, 3.9, 2.6, [0.05, 0.8, -1.0], 0.2, 0.05, 28, 1.0),
  item: K.sofa({ layout: "three", fabric: F.sage, ft: "linen", wood: W.walnut, legs: "tapered", cushions: "loose" }), pos: [-0.25, 0, -1.0],
  props: (s) => {
    add(s, K.rug(3.0, 2.0, "#a89f8f", -0.2, -0.1), K.floorLamp(-1.85, -1.15), K.sideTable(1.25, -1.1, W.walnut), K.artPanel(0.95, 1.25, ["#c9876a", "#ece4d4", "#3b3a37"], -0.25, 1.75, -1.53));
    const v = K.vase(0.3, "#e9e2d4"); v.position.set(1.25, 0.515, -1.1); add(s, v);
    const b = K.books(1.1, 0.515, -1.0); add(s, b);
  },
}));
job("showroom", 1800, 1125, (w, h) => stage({
  w, h, tone: "stone", wallZ: -1.7, patch: V(-0.6, 1.2, -1.7), exposure: 1.2, ...frame(w, h, 5.6, 2.6, [0, 0.7, -0.4], -0.28, 0.07, 28, 1.0),
  item: K.sofa({ layout: "five", fabric: F.stone, ft: "boucle", wood: W.espresso, legs: "block", cushions: "fixed" }), pos: [0, 0, -1.15],
  props: (s) => { add(s, K.rug(3.6, 2.4, "#d9d2c4", 0.35), K.floorLamp(2.7, -1.4), K.artPanel(1.2, 0.8, ["#40403c", "#ece4d4", "#c9876a"], 0, 1.7, -1.68));
    const t = K.centreTable({ wood: W.walnut }); t.position.set(0, 0, 0.5); add(s, t); }
}));

/* ---------- products (5:4) ---------- */
const P = (slug, tone, builder, fr, extra = {}) => job("products/" + slug, PW, PH, (w, h) => {
  const item = builder();
  return stage({ w, h, tone, wallZ: fr.wallZ ?? -1.35, patch: V(fr.px ?? 0.7, 1.15, fr.wallZ ?? -1.35), exposure: 1.65, item, ...frame(w, h, fr.W, fr.H, fr.t, fr.yaw ?? 0.42, fr.pitch ?? 0.1, 28, fr.m ?? 1.18), ...extra, pos: fr.pos || [0, 0, 0] });
});
const bedFr = { W: 3.0, H: 1.7, t: [0, 0.55, 0], yaw: 0.5, pitch: 0.1, wallZ: -1.25 };
P("slatted-headboard-bed", "warm", () => K.bed({ size: "queen", headboard: "slatted", wood: W.natural, bedding: "#e8e1d3", throwHex: F.sage }), bedFr, { props: (s) => { add(s, K.rug(2.6, 1.8, "#a89f8f", 0.4, 0), K.sideTable(1.15, -0.8, W.natural, 0.5)); } });
P("panel-bed", "stone", () => K.bed({ size: "queen", headboard: "panel", wood: W.honey, bedding: "#ddd5c4", throwHex: F.charcoal }), bedFr, { props: (s) => { add(s, K.rug(2.6, 1.8, "#a79e8e", 0.4, 0), K.floorLamp(-1.5, -1.0, 1.4)); } });
P("upholstered-headboard-bed", "sand", () => K.bed({ size: "queen", headboard: "upholstered", wood: W.walnut, fabric: F.stone, ft: "boucle", bedding: "#eee7d9", throwHex: F.terracotta }), bedFr, { props: (s) => { add(s, K.rug(2.6, 1.8, "#d6c9b0", 0.4, 0)); } });
P("storage-bed", "warm", () => K.bed({ size: "queen", headboard: "panel", storage: "drawers", wood: W.honey, bedding: "#e8e1d3", throwHex: F.navy }), bedFr, { props: (s) => { add(s, K.rug(2.6, 1.8, "#a89f8f", 0.4, 0)); } });
P("divan-cum-bed", "stone", () => K.bed({ size: "double", headboard: "panel", low: true, wood: W.honey, fabric: F.stone, ft: "linen", bedding: "#e6dfd0", throwHex: F.sage }), { ...bedFr, W: 2.7 }, { props: (s) => { add(s, K.rug(2.4, 1.7, "#cfc8bb", 0.4, 0)); } });
P("dressing-table-with-mirror", "warm", () => K.dressing({ wood: W.honey }), { W: 1.5, H: 1.7, t: [0, 0.8, 0], yaw: 0.32, pitch: 0.05, wallZ: -0.5, m: 1.1 }, { props: (s) => { add(s, K.rug(1.8, 1.2, "#a89f8f", 0.5, 0)); const st = K.stool({ wood: W.honey }); st.position.set(0.1, 0, 0.75); add(s, st); } });
P("bedroom-accent-chair", "sand", () => K.armchair({ fabric: F.sage, ft: "velvet", wood: W.walnut, legs: "tapered" }), { W: 1.3, H: 1.0, t: [0, 0.4, 0], yaw: 0.5, pitch: 0.08, wallZ: -0.8, m: 1.25 }, { props: (s) => { add(s, K.rug(1.8, 1.4, "#a89f8f", 0.2, 0), K.floorLamp(-0.9, -0.6, 1.4)); } });
P("three-seater-sofa", "stone", () => K.sofa({ layout: "three", fabric: F.stone, ft: "linen", wood: W.walnut, legs: "tapered", cushions: "fixed" }), { W: 3.0, H: 1.2, t: [0, 0.42, 0], yaw: 0.38, pitch: 0.08, wallZ: -0.8, m: 1.1 }, { props: (s) => { add(s, K.rug(2.8, 1.8, "#a89f8f", 0.3, 0)); } });
P("five-seater-sofa-set", "warm", () => K.sofa({ layout: "five", fabric: F.sage, ft: "linen", wood: W.espresso, legs: "block", cushions: "fixed" }), { W: 5.0, H: 1.6, t: [0, 0.45, 0], yaw: 0.28, pitch: 0.08, wallZ: -0.8, m: 1.0 }, { props: (s) => { add(s, K.rug(3.8, 2.2, "#a89f8f", 0.4, 0)); } });
P("seven-seater-sofa-set", "stone", () => K.sofa({ layout: "seven", fabric: F.navy, ft: "velvet", wood: W.walnut, legs: "tapered", cushions: "loose" }), { W: 6.3, H: 1.8, t: [0, 0.45, 0], yaw: 0.25, pitch: 0.08, wallZ: -0.8, m: 1.0 }, { props: (s) => { add(s, K.rug(4.2, 2.4, "#cfc8bb", 0.4, 0)); } });
P("sofa-cum-bed", "warm", () => K.sofaBedOpen({ fabric: F.charcoal, ft: "leatherette", wood: W.walnut, sleeper: "double" }), { W: 2.9, H: 1.3, t: [0, 0.4, 0], yaw: 0.55, pitch: 0.2, wallZ: -1.3, m: 1.1 }, { props: (s) => { add(s, K.rug(2.6, 2.2, "#d9d0c0", 0.1, 0)); } });
P("lounge-couch", "warm", () => K.sofa({ layout: "lshape", fabric: F.terracotta, ft: "velvet", wood: W.espresso, legs: "block", cushions: "loose" }), { W: 3.4, H: 1.3, t: [0.1, 0.42, 0.3], yaw: -0.45, pitch: 0.12, wallZ: -0.85, m: 1.05 }, { props: (s) => { add(s, K.rug(3.0, 2.4, "#a89f8f", 0.5, 0.2)); } });
P("teak-centre-table", "warm", () => K.centreTable({ wood: W.honey }), { W: 1.5, H: 0.9, t: [0, 0.25, 0], yaw: 0.3, pitch: 0.28, wallZ: -1.6, m: 1.15 }, { props: (s) => { add(s, K.rug(2.4, 1.8, "#a89f8f", 0, 0)); } });
P("wooden-stool", "sand", () => K.stool({ wood: W.natural }), { W: 0.9, H: 0.9, t: [0, 0.25, 0], yaw: 0.35, pitch: 0.12, wallZ: -0.9, m: 1.35 });
P("six-seater-dining-table", "warm", () => K.dining({ shape: "rectangular", capacity: 6, chairs: "wood", wood: W.honey }), { W: 3.2, H: 1.4, t: [0, 0.5, 0], yaw: 0.45, pitch: 0.2, wallZ: -2.0, m: 1.05 }, { props: (s) => { add(s, K.rug(3.4, 2.4, "#cfc8bb", 0, 0)); const v = K.vase(0.26, "#e9e2d4"); v.position.set(0, 0.75, 0); add(s, v); } });
P("round-dining-table", "stone", () => K.dining({ shape: "round", capacity: 4, chairs: "upholstered", wood: W.natural, fabric: F.sage, ft: "linen" }), { W: 2.2, H: 1.3, t: [0, 0.45, 0], yaw: 0.4, pitch: 0.2, wallZ: -1.7, m: 1.1 }, { props: (s) => { add(s, K.rug(2.6, 2.6, "#a89f8f", 0, 0)); const v = K.vase(0.26, "#e9e2d4"); v.position.set(0, 0.75, 0); add(s, v); } });
P("wooden-dining-chair", "sand", () => K.diningChair({ wood: W.honey, kind: "wood", s: 1.2 }), { W: 0.9, H: 1.1, t: [0, 0.45, 0], yaw: 0.5, pitch: 0.08, wallZ: -0.8, m: 1.3 });
P("sleepwell-mattresses", "stone", () => K.mattress(), { W: 2.4, H: 1.0, t: [0, 0.3, 0], yaw: 0.6, pitch: 0.28, wallZ: -1.8, m: 1.1 });

/* ---------- dark "design your own" tiles (4:3) ---------- */
const D = (name, builder, fr, extra = {}) => job("design/" + name, 1200, 900, (w, h) => stage({ w, h, tone: "dark", wallZ: fr.wallZ ?? -1.2, patch: V(0.6, 1.1, fr.wallZ ?? -1.2), exposure: 1.5, sun: 3.4, item: builder(), ...frame(w, h, fr.W, fr.H, fr.t, fr.yaw ?? 0.4, fr.pitch ?? 0.1, 28, fr.m ?? 1.12), ...extra }));
D("bed", () => K.bed({ size: "queen", headboard: "slatted", wood: W.natural, bedding: "#e8e1d3", throwHex: F.terracotta }), bedFr, { props: (s) => { add(s, K.rug(2.6, 1.8, "#6a645a", 0.4, 0)); } });
D("sofa", () => K.sofa({ layout: "three", fabric: F.navy, ft: "velvet", wood: W.walnut, legs: "metal", cushions: "loose" }), { W: 3.0, H: 1.2, t: [0, 0.45, 0], yaw: 0.38, wallZ: -0.9 }, { props: (s) => { add(s, K.rug(2.8, 1.8, "#6a645a", 0.3, 0)); } });
D("sofa-cum-bed", () => K.sofaBedOpen({ fabric: F.terracotta, ft: "velvet", wood: W.walnut }), { W: 2.9, H: 1.3, t: [0, 0.4, 0], yaw: 0.55, pitch: 0.2, wallZ: -1.3 }, { props: (s) => { add(s, K.rug(2.6, 2.2, "#6a645a", 0.1, 0)); } });
D("dining", () => K.dining({ shape: "oval", capacity: 6, chairs: "upholstered", wood: W.natural, fabric: F.sage, ft: "linen" }), { W: 3.0, H: 1.4, t: [0, 0.5, 0], yaw: 0.4, pitch: 0.18, wallZ: -2.0 }, { props: (s) => { add(s, K.rug(3.2, 2.2, "#6a645a", 0, 0)); } });

/* ---------- The Art of Making (16:10). Illustrative process scenes — NOT our workshop. ---------- */
const M = (name, tone, w, h, fn, o = {}) => job("making/" + name, 1600, 1000, (W_, H_) => stage({ w: W_, h: H_, tone, exposure: 1.7, sun: 3.6, ...fn(W_, H_) , ...o }));
M("wood", "dark", 1600, 1000, (w, h) => {
  const item = G();
  const logs = [[-0.55, 0.2, 0.0, 0.2, 1.7], [-0.15, 0.2, 0.0, 0.19, 1.65], [0.28, 0.2, 0.0, 0.21, 1.75], [-0.35, 0.55, 0.0, 0.19, 1.7], [0.08, 0.57, 0.0, 0.2, 1.68], [-0.14, 0.92, 0.0, 0.18, 1.72]];
  logs.forEach(([x, y, z, r, len]) => { const l = K.log(len, r); l.position.set(x - 0.0, y, z + (Math.random() * 0.0)); l.rotation.y = 0; item.add(l); });
  const pl = G(); for (let i = 0; i < 6; i++) { const p = K.plank(1.8, 0.28, 0.04, "#c9a26d"); p.position.set(0, 0.03 + i * 0.075, 0); pl.add(p); for (const bx of [-0.7, 0.7]) { const b = box(0.04, 0.035, 0.28, plain("#8b6b45", 0.9)); b.position.set(bx, 0.012 + i * 0.075 + 0.0, 0); } }
  pl.position.set(1.75, 0, 0.4); pl.rotation.y = -0.15; item.add(pl);
  return { item, wallZ: -1.6, patch: V(0.6, 1.15, -1.6), ...frame(w, h, 3.6, 1.7, [0.45, 0.5, -0.6], 0.42, 0.08, 30, 1.0), pos: [0, 0, -0.6] };
});
M("cut", "dark", 1600, 1000, (w, h) => {
  const item = G(); const bench = K.workbench(); item.add(bench);
  const p = K.plank(1.7, 0.24, 0.04, "#c9a26d"); p.position.set(0, 0.92, 0.02); item.add(p);
  for (const x of [-0.55, 0.0, 0.62]) { const l = box(0.004, 0.002, 0.24, plain("#2a1f16", 0.9)); l.position.set(x, 0.942, 0.02); item.add(l); }
  const rule = box(0.7, 0.002, 0.03, new THREE.MeshStandardMaterial({ color: "#b7bcc0", roughness: 0.3, metalness: 0.8 })); rule.position.set(-0.3, 0.9, 0.25); item.add(rule);
  const saw = K.handSaw(); saw.position.set(0.55, 0.905, 0.28); saw.rotation.set(-Math.PI / 2, 0, 0.0); saw.rotation.y = 0; item.add(saw);
  const sq1 = box(0.3, 0.012, 0.025, plain("#25272a", 0.5, 0.4)), sq2 = box(0.025, 0.012, 0.18, plain("#6b4a2e", 0.6)); sq1.position.set(-0.85, 0.9, -0.28); sq2.position.set(-0.99, 0.9, -0.2); item.add(sq1, sq2);
  const pc = rbox(0.14, 0.012, 0.012, 0.004, plain("#d6a43a", 0.6), 2); pc.position.set(0.15, 0.905, 0.3); pc.rotation.y = 0.5; item.add(pc);
  return { item, wallZ: -1.4, patch: V(0.4, 1.2, -1.4), ...frame(w, h, 2.3, 1.0, [0, 0.9, 0.05], 0.5, 0.34, 30, 1.0) };
});
M("build", "dark", 1600, 1000, (w, h) => {
  const item = G(); item.add(K.workbench());
  const wm = () => K.woodMat("#b98a52", [0.4, 1]);
  const frameG = G();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(0.06, 0.62, 0.06, wm()); l.position.set(sx * 0.5, 0.31, sz * 0.26); frameG.add(l); }
  for (const sz of [-1, 1]) { const r = box(1.04, 0.08, 0.04, wm()); r.position.set(0, 0.55, sz * 0.26); frameG.add(r); const r2 = box(1.04, 0.05, 0.04, wm()); r2.position.set(0, 0.12, sz * 0.26); frameG.add(r2); }
  for (const sx of [-1, 1]) { const r = box(0.04, 0.08, 0.5, wm()); r.position.set(sx * 0.5, 0.55, 0); frameG.add(r); const r2 = box(0.04, 0.05, 0.5, wm()); r2.position.set(sx * 0.5, 0.12, 0); frameG.add(r2); }
  frameG.position.set(0, 0.9, 0); frameG.rotation.y = 0.1; item.add(frameG);
  const c1 = K.barClamp(0.9); c1.position.set(0, 1.52, 0.26); c1.rotation.y = 0.0; const c2 = K.barClamp(0.9); c2.position.set(0, 1.02, -0.3); item.add(c1, c2);
  const c3 = K.barClamp(0.7); c3.position.set(0.0, 0.6 + 0.9, 0.25); c3.visible = false; item.add(c3);
  return { item, wallZ: -1.5, patch: V(0.4, 1.2, -1.5), ...frame(w, h, 2.1, 1.5, [0, 1.15, 0], 0.4, 0.16, 30, 1.0) };
});
M("foam", "warm", 1600, 1000, (w, h) => {
  const item = G(); const cols = ["#f4e9c8", "#f8f0d8", "#f2e6c2", "#f6edd0"];
  for (let i = 0; i < 5; i++) { const sl = K.foamSlab(1.3, 0.9, 0.075, cols[i % 4]); sl.position.set((i % 2) * 0.03, 0.04 + i * 0.078, 0); sl.rotation.y = (i - 2) * 0.03; item.add(sl); }
  const cush = K.foamSlab(0.8, 0.6, 0.16, "#f6ecc9"); cush.position.set(1.15, 0.09, 0.55); cush.rotation.y = 0.3; item.add(cush);
  const cush2 = K.foamSlab(0.7, 0.5, 0.12, "#efdfae"); cush2.position.set(1.0, 0.07, -0.5); cush2.rotation.y = -0.35; item.add(cush2);
  return { item, wallZ: -1.4, patch: V(0.5, 1.2, -1.4), ...frame(w, h, 2.7, 1.1, [0.45, 0.25, 0.0], 0.5, 0.2, 30, 1.0), tone: undefined };
});
M("fabric", "warm", 1600, 1000, (w, h) => {
  const item = G(); const cols = ["#8b967f", "#b5694b", "#34425a", "#e6dccb", "#b3aa9b", "#4a4846"], hs = [0.9, 0.75, 1.0, 0.8, 0.95, 0.7];
  cols.forEach((c, i) => { const b = K.fabricBolt(c, hs[i], 0.085, i % 2 ? "linen" : "boucle"); b.position.set(-1.2 + i * 0.26, 0, (i % 2) * 0.12); item.add(b); });
  const t = K.sideTable(1.1, 0.2, "#b98a52", 0.62, 0.55); item.add(t);
  const fan = K.swatchFan(cols.concat(["#c9876a"])); fan.position.set(1.1, 0.65, 0.2); item.add(fan);
  return { item, wallZ: -1.2, patch: V(0.4, 1.2, -1.2), ...frame(w, h, 3.1, 1.25, [0.0, 0.5, 0.1], 0.2, 0.1, 30, 1.0) };
});
M("finish", "dark", 1600, 1000, (w, h) => {
  const item = G(); item.add(K.workbench());
  const raw = K.plank(0.85, 0.28, 0.045, "#c9a26d"), dark = K.plank(0.85, 0.28, 0.045, "#7a4f2c"); raw.position.set(0.43, 0.925, 0.0); dark.position.set(-0.43, 0.925, 0.0); item.add(raw, dark);
  dark.material.roughness = 0.25;
  const bru = K.brush(); bru.position.set(0.15, 0.96, 0.36); bru.rotation.y = 0.6; item.add(bru);
  const tn = K.tin(); tn.position.set(-0.95, 0.9, -0.2); item.add(tn);
  const blk = rbox(0.11, 0.05, 0.07, 0.01, plain("#9e6b3a", 0.9), 2); blk.position.set(0.95, 0.925, 0.25); blk.rotation.y = 0.3; item.add(blk);
  return { item, wallZ: -1.4, patch: V(0.4, 1.2, -1.4), ...frame(w, h, 2.0, 0.85, [0, 0.95, 0.05], 0.35, 0.34, 30, 1.0) };
});
job("making/home", 1600, 1000, (w, h) => stage({
  w, h, tone: "sand", wallZ: -1.5, patch: V(-0.2, 1.2, -1.5), exposure: 1.65, ...frame(w, h, 3.4, 2.2, [0.1, 0.8, -1.0], -0.25, 0.05, 28, 1.0),
  item: K.sofa({ layout: "three", fabric: F.terracotta, ft: "velvet", wood: W.walnut, legs: "tapered", cushions: "fixed" }), pos: [0, 0, -1.0],
  props: (s) => { add(s, K.rug(2.8, 1.8, "#d9d0c0", -0.2, 0), K.floorLamp(1.7, -1.2), K.artPanel(1.2, 0.8, ["#40403c", "#ece4d4", "#b0903f"], 0, 1.65, -1.48)); const t = K.centreTable({ wood: W.walnut }); t.position.set(0.1, 0, 0.0); add(s, t); },
}));

export function listJobs() { return Object.keys(JOBS); }
