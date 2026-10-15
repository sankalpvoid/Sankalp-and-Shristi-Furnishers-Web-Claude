import type { ArtParams, ConfiguratorType, OptionGroup, Selections } from "./types";

/** Map configurator selections → illustrative preview parameters (layered SVG; NOT a 3D model). */
export function previewArt(conf: ConfiguratorType, groups: OptionGroup[], sel: Selections): ArtParams {
  const sw = (gk: string) => {
    const g = groups.find((x) => x.key === gk);
    return g?.values.find((v) => v.key === String(sel[gk]))?.swatch || undefined;
  };
  switch (conf) {
    case "bed":
      return { kind: "bed", size: String(sel.size), headboard: String(sel.headboard), storage: String(sel.storage ?? "none"), wood: sw("finish"), fabric: sw("fabric"), custom_width: Number(sel.custom_width) || undefined };
    case "sofa":
      return { kind: "sofa", layout: String(sel.layout), legs: String(sel.legs), cushions: String(sel.cushions), wood: sw("finish"), fabric: sw("fabric"), fabric_type: String(sel.fabric_type) };
    case "sofa_bed":
      return { kind: "sofabed", layout: String(sel.layout), sleeper: String(sel.sleeper), storage: String(sel.storage ?? "none"), wood: sw("finish"), fabric: sw("fabric"), fabric_type: String(sel.fabric_type) };
    case "dining":
      return { kind: "dining", shape: String(sel.shape), capacity: Number(sel.capacity), chairs: String(sel.chairs), wood: sw("finish"), fabric: sw("chair_fabric") };
  }
}

/** Seed configurator defaults from a product's illustration params where keys match. */
export function presetFromProduct(conf: ConfiguratorType, art: ArtParams): Selections {
  const out: Selections = {};
  const pick = (k: string, from = k) => { if (art[from] !== undefined) out[k] = String(art[from]); };
  if (conf === "bed") { pick("headboard"); pick("storage"); }
  if (conf === "sofa") { pick("layout"); pick("legs"); }
  if (conf === "dining") { pick("shape"); pick("capacity"); pick("chairs"); }
  return out;
}
