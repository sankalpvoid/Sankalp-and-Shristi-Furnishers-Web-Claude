import type { ConfiguratorType } from "@/lib/types";

export const WOODS = [
  { key: "natural", label: "Natural teak", swatch: "#b98a52" },
  { key: "honey", label: "Honey teak", swatch: "#a8692f" },
  { key: "walnut", label: "Walnut stain", swatch: "#6e4a2f" },
  { key: "espresso", label: "Espresso", swatch: "#3b2a20" },
  { key: "ash", label: "Ash wash", swatch: "#b8ad9c" },
];
export const FABRIC_COLOURS = [
  { key: "ivory", label: "Ivory", swatch: "#e6dccb" },
  { key: "stone", label: "Stone", swatch: "#b3aa9b" },
  { key: "sage", label: "Sage", swatch: "#8b967f" },
  { key: "terracotta", label: "Terracotta", swatch: "#b5694b" },
  { key: "navy", label: "Ink blue", swatch: "#34425a" },
  { key: "charcoal", label: "Charcoal", swatch: "#4a4846" },
];

export const CATEGORIES = [
  { slug: "beds", name: "Beds", group: "Bedroom", art: "bed", desc: "Single, double, queen and king beds, made to your size and finish." },
  { slug: "divan-cum-beds", name: "Divan-cum-beds", group: "Bedroom", art: "divan", desc: "Beds with a sit-up divan base for storage and everyday use." },
  { slug: "dressing-tables", name: "Dressing tables", group: "Bedroom", art: "dressing", desc: "Dressing tables with mirror and drawers." },
  { slug: "bedroom-chairs", name: "Bedroom chairs", group: "Bedroom", art: "chair", desc: "A quiet chair for the corner of the room." },
  { slug: "sofas", name: "Sofas", group: "Living room", art: "sofa", desc: "Sofas and sofa sets, from two seats to seven." },
  { slug: "sofa-cum-beds", name: "Sofa-cum-beds", group: "Living room", art: "sofabed", desc: "Sofas that open out into a bed for guests." },
  { slug: "couches", name: "Couches", group: "Living room", art: "couch", desc: "Deep, relaxed seating with a chaise or lounge end." },
  { slug: "centre-tables", name: "Centre tables", group: "Living room", art: "centretable", desc: "Tables to anchor the living room." },
  { slug: "stools", name: "Stools", group: "Living room", art: "stool", desc: "Small, useful and handsome." },
  { slug: "dining-tables", name: "Dining tables", group: "Dining", art: "dining", desc: "Dining tables in the shape and size your family needs." },
  { slug: "dining-chairs", name: "Dining chairs", group: "Dining", art: "diningchair", desc: "Dining chairs, wooden or upholstered." },
  { slug: "mattresses", name: "Mattresses", group: "Mattresses", art: "mattress", desc: "Sleepwell mattresses, available at the showroom." },
];

interface G { key: string; label: string; help?: string; kind?: "choice" | "swatch"; show_when?: Record<string, string[]>; values: { key: string; label: string; swatch?: string; detail?: string }[] }

const woodVals = WOODS.map((w) => ({ key: w.key, label: w.label, swatch: w.swatch }));
const fabVals = FABRIC_COLOURS.map((w) => ({ key: w.key, label: w.label, swatch: w.swatch }));
const fabricType = [
  { key: "velvet", label: "Velvet", detail: "Soft, with a slight sheen." },
  { key: "linen", label: "Linen-look weave", detail: "Natural, textured, relaxed." },
  { key: "boucle", label: "Textured weave", detail: "Tactile and hard-wearing." },
  { key: "leatherette", label: "Faux leather", detail: "Easy to wipe clean." },
];

export const OPTION_CATALOG: Record<ConfiguratorType, G[]> = {
  bed: [
    { key: "size", label: "Bed size", help: "Indicative sizes. Exact dimensions are confirmed in your quotation.", values: [
      { key: "single", label: "Single", detail: "About 3 × 6 ft" },
      { key: "double", label: "Double", detail: "About 4.5 × 6 ft" },
      { key: "queen", label: "Queen", detail: "About 5 × 6.5 ft" },
      { key: "king", label: "King", detail: "About 6 × 6.5 ft" },
      { key: "custom", label: "Custom size", detail: "Tell us the size you need" },
    ] },
    { key: "headboard", label: "Headboard", values: [
      { key: "panel", label: "Solid panel" },
      { key: "slatted", label: "Slatted" },
      { key: "arched", label: "Arched" },
      { key: "upholstered", label: "Upholstered" },
    ] },
    { key: "finish", label: "Wood finish", kind: "swatch", values: woodVals },
    { key: "fabric", label: "Headboard fabric colour", kind: "swatch", show_when: { headboard: ["upholstered"] }, values: fabVals },
    { key: "storage", label: "Storage", values: [
      { key: "none", label: "No storage" },
      { key: "drawers", label: "Drawers" },
      { key: "lift", label: "Lift-up box storage" },
    ] },
  ],
  sofa: [
    { key: "layout", label: "Seating layout", values: [
      { key: "two", label: "Two-seater" },
      { key: "three", label: "Three-seater" },
      { key: "five", label: "Five-seater set", detail: "3 + 1 + 1" },
      { key: "seven", label: "Seven-seater set", detail: "3 + 2 + 1 + 1" },
      { key: "lshape", label: "L-shape", detail: "Sofa with chaise end" },
    ] },
    { key: "fabric_type", label: "Upholstery", values: fabricType },
    { key: "fabric", label: "Colour", kind: "swatch", values: fabVals },
    { key: "legs", label: "Legs", values: [
      { key: "tapered", label: "Tapered wood" },
      { key: "block", label: "Block wood" },
      { key: "metal", label: "Slim metal" },
    ] },
    { key: "finish", label: "Wood finish", kind: "swatch", values: woodVals },
    { key: "cushions", label: "Back cushions", values: [
      { key: "fixed", label: "Fixed back" },
      { key: "loose", label: "Loose cushions" },
      { key: "tufted", label: "Button-tufted" },
    ] },
  ],
  sofa_bed: [
    { key: "layout", label: "Sofa size", values: [
      { key: "two", label: "Two-seater" },
      { key: "three", label: "Three-seater" },
    ] },
    { key: "mechanism", label: "Opening mechanism", values: [
      { key: "pullout", label: "Pull-out" },
      { key: "foldout", label: "Fold-down" },
    ] },
    { key: "sleeper", label: "Sleeping size", values: [
      { key: "single", label: "Single sleeper" },
      { key: "double", label: "Double sleeper" },
    ] },
    { key: "fabric_type", label: "Upholstery", values: fabricType },
    { key: "fabric", label: "Colour", kind: "swatch", values: fabVals },
    { key: "finish", label: "Wood finish", kind: "swatch", values: woodVals },
    { key: "storage", label: "Storage", values: [
      { key: "none", label: "No storage" },
      { key: "under", label: "Under-seat storage" },
    ] },
  ],
  dining: [
    { key: "shape", label: "Table shape", values: [
      { key: "rectangular", label: "Rectangular" },
      { key: "round", label: "Round" },
      { key: "oval", label: "Oval" },
      { key: "square", label: "Square" },
    ] },
    { key: "capacity", label: "Seats", help: "Indicative sizes. Exact dimensions are confirmed in your quotation.", values: [
      { key: "4", label: "4 seats" },
      { key: "6", label: "6 seats" },
      { key: "8", label: "8 seats" },
    ] },
    { key: "finish", label: "Wood finish", kind: "swatch", values: woodVals },
    { key: "chairs", label: "Chairs", values: [
      { key: "none", label: "Table only" },
      { key: "wood", label: "Wooden chairs" },
      { key: "upholstered", label: "Upholstered chairs" },
    ] },
    { key: "chair_fabric", label: "Chair fabric colour", kind: "swatch", show_when: { chairs: ["upholstered"] }, values: fabVals },
  ],
};

export const DEFAULT_RULES = [
  { c: "dining", ig: "shape", iv: "round", tg: "capacity", tv: "8", note: "Suggested default: very large round tables are impractical. Edit if not applicable." },
  { c: "dining", ig: "shape", iv: "square", tg: "capacity", tv: "8", note: "Suggested default. Edit if not applicable." },
  { c: "dining", ig: "shape", iv: "square", tg: "capacity", tv: "6", note: "Suggested default. Edit if not applicable." },
];

export interface SeedProduct {
  slug: string; name: string; cat: string; sub?: string; short: string; long: string;
  material: string; finish?: string; sizes?: string[]; colours?: string[]; upholstery?: string[];
  configurator?: ConfiguratorType; art: Record<string, string | number | boolean>; featured?: boolean;
}

const NOTE = " This is a sample design used to show how the catalogue works. Availability, sizes and materials are confirmed by the showroom team.";
const WOOD_NOTE = "Solid teak frame (owner-stated for our solid-teak furniture; confirm for this design)";

export const SEED_PRODUCTS: SeedProduct[] = [
  { slug: "slatted-headboard-bed", name: "Slatted Headboard Bed", cat: "beds", short: "A teak bed with a slatted headboard, made to your size.", long: "A clean bed with a slatted headboard that lets the timber do the talking. Choose the size, finish and storage." + NOTE, material: WOOD_NOTE, sizes: ["Single", "Double", "Queen", "King", "Custom"], configurator: "bed", art: { kind: "bed", wood: "#b98a52", headboard: "slatted" }, featured: true },
  { slug: "panel-bed", name: "Panel Bed", cat: "beds", short: "A solid panel headboard with a low, grounded frame.", long: "A calm, solid-looking bed with a panelled headboard." + NOTE, material: WOOD_NOTE, sizes: ["Single", "Double", "Queen", "King", "Custom"], configurator: "bed", art: { kind: "bed", wood: "#8d5d33", headboard: "panel" } },
  { slug: "upholstered-headboard-bed", name: "Upholstered Headboard Bed", cat: "beds", short: "A padded headboard in the fabric and colour you choose.", long: "A softer bed with an upholstered headboard on a timber frame. Fabric and colour are chosen with you." + NOTE, material: "Frame material to be confirmed; headboard upholstered", sizes: ["Double", "Queen", "King", "Custom"], configurator: "bed", art: { kind: "bed", wood: "#6e4a2f", headboard: "upholstered", fabric: "#b3aa9b" } },
  { slug: "storage-bed", name: "Storage Bed", cat: "beds", sub: "Storage beds", short: "A bed with drawers or a lift-up base for storage.", long: "A practical bed with storage built into the base, where offered for the chosen size." + NOTE, material: WOOD_NOTE, sizes: ["Double", "Queen", "King"], configurator: "bed", art: { kind: "bed", wood: "#a8692f", headboard: "panel", storage: "drawers" } },
  { slug: "divan-cum-bed", name: "Divan-cum-Bed", cat: "divan-cum-beds", short: "A low divan base with a simple headboard.", long: "A divan-style bed with a sit-up base." + NOTE, material: "To be confirmed", sizes: ["Single", "Double"], art: { kind: "divan", wood: "#8d5d33", fabric: "#b3aa9b" } },
  { slug: "dressing-table-with-mirror", name: "Dressing Table with Mirror", cat: "dressing-tables", short: "A dressing table with a framed mirror and drawers.", long: "A dressing table with drawers and a framed mirror." + NOTE, material: WOOD_NOTE, art: { kind: "dressing", wood: "#a8692f" } },
  { slug: "bedroom-accent-chair", name: "Bedroom Accent Chair", cat: "bedroom-chairs", short: "An upholstered chair with timber legs.", long: "A comfortable chair for a bedroom corner." + NOTE, material: "To be confirmed", upholstery: ["Velvet", "Linen-look weave"], art: { kind: "chair", wood: "#6e4a2f", fabric: "#8b967f" } },
  { slug: "three-seater-sofa", name: "Three-Seater Sofa", cat: "sofas", short: "A three-seater on timber legs, in the fabric you choose.", long: "A well-proportioned three-seater. Choose fabric, colour, legs and cushions." + NOTE, material: "Timber frame; upholstery to be confirmed", upholstery: ["Velvet", "Linen-look weave", "Textured weave"], configurator: "sofa", art: { kind: "sofa", layout: "three", wood: "#6e4a2f", fabric: "#b3aa9b", legs: "tapered" }, featured: true },
  { slug: "five-seater-sofa-set", name: "Five-Seater Sofa Set", cat: "sofas", sub: "Sofa sets", short: "A 3 + 1 + 1 set for a family living room.", long: "A three-seater with two single chairs." + NOTE, material: "Timber frame; upholstery to be confirmed", configurator: "sofa", art: { kind: "sofa", layout: "five", wood: "#3b2a20", fabric: "#8b967f", legs: "block" }, featured: true },
  { slug: "seven-seater-sofa-set", name: "Seven-Seater Sofa Set", cat: "sofas", sub: "Sofa sets", short: "A 3 + 2 + 1 + 1 set for larger rooms.", long: "A full living-room set." + NOTE, material: "Timber frame; upholstery to be confirmed", configurator: "sofa", art: { kind: "sofa", layout: "seven", wood: "#6e4a2f", fabric: "#34425a", legs: "tapered" } },
  { slug: "sofa-cum-bed", name: "Sofa-cum-Bed", cat: "sofa-cum-beds", short: "Seats two or three by day, sleeps a guest at night.", long: "A sofa that opens out into a bed." + NOTE, material: "To be confirmed (frame and mechanism)", configurator: "sofa_bed", art: { kind: "sofabed", wood: "#6e4a2f", fabric: "#4a4846" }, featured: true },
  { slug: "lounge-couch", name: "Lounge Couch", cat: "couches", short: "A deep couch with a chaise end.", long: "Relaxed seating with a chaise end." + NOTE, material: "To be confirmed", upholstery: ["Velvet", "Linen-look weave"], art: { kind: "couch", wood: "#3b2a20", fabric: "#b5694b" } },
  { slug: "teak-centre-table", name: "Teak Centre Table", cat: "centre-tables", short: "A low table in solid timber.", long: "A centre table for the living room." + NOTE, material: WOOD_NOTE, art: { kind: "centretable", wood: "#a8692f", shape: "round" } },
  { slug: "wooden-stool", name: "Wooden Stool", cat: "stools", short: "A small stool in turned timber.", long: "A stool that works as a seat or a side table." + NOTE, material: WOOD_NOTE, art: { kind: "stool", wood: "#b98a52" } },
  { slug: "six-seater-dining-table", name: "Six-Seater Dining Table", cat: "dining-tables", short: "A rectangular teak dining table for six.", long: "A rectangular dining table. Choose size, finish and chairs." + NOTE, material: WOOD_NOTE, sizes: ["4 seats", "6 seats", "8 seats"], configurator: "dining", art: { kind: "dining", shape: "rectangular", capacity: 6, wood: "#a8692f", chairs: "wood" }, featured: true },
  { slug: "round-dining-table", name: "Round Dining Table", cat: "dining-tables", short: "A round table for four to six.", long: "A round dining table that keeps everyone close." + NOTE, material: WOOD_NOTE, configurator: "dining", art: { kind: "dining", shape: "round", capacity: 4, wood: "#b98a52", chairs: "upholstered", fabric: "#8b967f" } },
  { slug: "wooden-dining-chair", name: "Wooden Dining Chair", cat: "dining-chairs", short: "A dining chair in solid timber.", long: "A dining chair to pair with our tables." + NOTE, material: WOOD_NOTE, art: { kind: "diningchair", wood: "#a8692f" } },
  { slug: "sleepwell-mattresses", name: "Sleepwell Mattresses", cat: "mattresses", short: "Sleepwell mattresses, available at the showroom.", long: "We are a Sleepwell partner. Visit the showroom to see the mattresses we offer and find the right fit for your bed. Models, sizes and prices are confirmed in the showroom." , material: "See Sleepwell product information", art: { kind: "mattress" } },
];
