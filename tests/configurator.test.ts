import { describe, expect, it } from "vitest";
import { buildSummary, defaultSelections, normalise, validateSelections } from "../src/lib/configurator";
import type { OptionGroup, OptionRule } from "../src/lib/types";

const v = (key: string, label = key) => ({ id: 1, key, label, swatch: "", detail: "", enabled: 1, verified: 0, sort_order: 0 });
const g = (key: string, vals: string[], extra: Partial<OptionGroup> = {}): OptionGroup => ({
  id: 1, configurator: "dining", key, label: key, help: "", kind: "choice", required: 1, enabled: 1, show_when: "", sort_order: 0, values: vals.map((x) => v(x)), ...extra,
});
const groups = [g("shape", ["rect", "round"]), g("cap", ["4", "6", "8"]), g("chairs", ["none", "uph"]), g("fab", ["a", "b"], { show_when: JSON.stringify({ chairs: ["uph"] }) })];
const rules: OptionRule[] = [{ id: 1, configurator: "dining", if_group: "shape", if_value: "round", then_group: "cap", then_value: "8", note: "" }];

describe("configurator logic", () => {
  it("defaults pick first available and hide dependent groups", () => {
    const s = defaultSelections(groups, rules);
    expect(s).toEqual({ shape: "rect", cap: "4", chairs: "none" });
  });
  it("replaces choices disabled by rules", () => {
    expect(normalise(groups, rules, { shape: "round", cap: "8", chairs: "none" }).cap).toBe("4");
  });
  it("shows dependent group when condition met", () => {
    expect(normalise(groups, rules, { shape: "rect", cap: "6", chairs: "uph" }).fab).toBe("a");
  });
  it("rejects invalid server-side selections", () => {
    expect(validateSelections("dining", groups, rules, { shape: "round", cap: "8", chairs: "none" }).ok).toBe(false);
    expect(validateSelections("dining", groups, rules, { shape: "hexagon", cap: "4", chairs: "none" }).ok).toBe(false);
    expect(validateSelections("dining", groups, rules, { shape: "rect", cap: "6", chairs: "none" }).ok).toBe(true);
  });
  it("requires valid custom bed dimensions", () => {
    const bed = [g("size", ["single", "custom"], { configurator: "bed" })];
    expect(validateSelections("bed", bed, [], { size: "custom" }).ok).toBe(false);
    expect(validateSelections("bed", bed, [], { size: "custom", custom_length: 78, custom_width: 60 }).ok).toBe(true);
    expect(validateSelections("bed", bed, [], { size: "custom", custom_length: 5, custom_width: 60 }).ok).toBe(false);
  });
  it("builds summary lines", () => {
    expect(buildSummary("dining", groups, { shape: "round", cap: "4", chairs: "none" })).toHaveLength(3);
  });
});
