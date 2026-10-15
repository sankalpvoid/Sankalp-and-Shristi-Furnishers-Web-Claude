import type { ConfiguratorType, OptionGroup, OptionRule, Selections, SummaryLine } from "./types";

/** Pure logic shared by the browser (live UI) and server (validation). */

export interface CustomDims {
  group: string; value: string;
  fields: { key: string; label: string; unit: string; min: number; max: number }[];
}
export const CUSTOM_DIMS: Partial<Record<ConfiguratorType, CustomDims>> = {
  bed: {
    group: "size", value: "custom",
    fields: [
      { key: "custom_length", label: "Length", unit: "in", min: 48, max: 100 },
      { key: "custom_width", label: "Width", unit: "in", min: 24, max: 96 },
    ],
  },
};

export function parseShowWhen(s: string): Record<string, string[]> {
  if (!s) return {};
  try { return JSON.parse(s); } catch { return {}; }
}

export function groupVisible(g: OptionGroup, sel: Selections): boolean {
  if (!g.enabled) return false;
  const sw = parseShowWhen(g.show_when);
  return Object.entries(sw).every(([k, vals]) => vals.includes(String(sel[k])));
}

/** Value keys available for a group given current selections, product limits and rules. */
export function availableValues(g: OptionGroup, sel: Selections, rules: OptionRule[], limits: Record<string, string[]> = {}): Set<string> {
  const out = new Set<string>();
  const lim = limits[g.key];
  for (const v of g.values) {
    if (!v.enabled) continue;
    if (lim && lim.length && !lim.includes(v.key)) continue;
    const blocked = rules.some((r) => r.then_group === g.key && r.then_value === v.key && String(sel[r.if_group]) === r.if_value);
    if (!blocked) out.add(v.key);
  }
  return out;
}

/** Make a selection set valid: fill defaults, replace anything no longer available. */
export function normalise(groups: OptionGroup[], rules: OptionRule[], input: Selections, limits: Record<string, string[]> = {}): Selections {
  const sel: Selections = { ...input };
  // Iterate to a fixpoint (rules can chain).
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const g of groups) {
      if (!groupVisible(g, sel)) { if (g.key in sel) { delete sel[g.key]; changed = true; } continue; }
      const avail = availableValues(g, sel, rules, limits);
      const cur = String(sel[g.key] ?? "");
      if (!avail.has(cur)) {
        const first = g.values.find((v) => avail.has(v.key));
        if (first) { sel[g.key] = first.key; changed = true; } else if (g.key in sel) { delete sel[g.key]; changed = true; }
      }
    }
    if (!changed) break;
  }
  return sel;
}

export function defaultSelections(groups: OptionGroup[], rules: OptionRule[], limits: Record<string, string[]> = {}, preset: Selections = {}): Selections {
  return normalise(groups, rules, preset, limits);
}

export function validateCustom(conf: ConfiguratorType, sel: Selections): { ok: true; sel: Selections } | { ok: false; error: string } {
  const cd = CUSTOM_DIMS[conf];
  const out: Selections = { ...sel };
  if (cd) {
    for (const f of cd.fields) delete out[f.key];
    if (String(sel[cd.group]) === cd.value) {
      for (const f of cd.fields) {
        const n = Number(sel[f.key]);
        if (!Number.isFinite(n) || n < f.min || n > f.max) return { ok: false, error: `${f.label} must be between ${f.min} and ${f.max} ${f.unit}.` };
        out[f.key] = Math.round(n * 10) / 10;
      }
    }
  }
  return { ok: true, sel: out };
}

/** Strictly validate a client-supplied selection against the real option model. */
export function validateSelections(conf: ConfiguratorType, groups: OptionGroup[], rules: OptionRule[], sel: Selections, limits: Record<string, string[]> = {}):
  { ok: true; sel: Selections } | { ok: false; error: string } {
  const cust = validateCustom(conf, sel);
  if (!cust.ok) return cust;
  const clean: Selections = {};
  for (const g of groups) {
    if (!groupVisible(g, cust.sel)) continue;
    const v = cust.sel[g.key];
    if (v === undefined) { if (g.required) return { ok: false, error: `Please choose: ${g.label}.` }; continue; }
    if (!availableValues(g, cust.sel, rules, limits).has(String(v))) return { ok: false, error: `"${g.label}" has an unavailable choice.` };
    clean[g.key] = String(v);
  }
  const cd = CUSTOM_DIMS[conf];
  if (cd) for (const f of cd.fields) if (f.key in cust.sel) clean[f.key] = cust.sel[f.key];
  return { ok: true, sel: clean };
}

export function buildSummary(conf: ConfiguratorType, groups: OptionGroup[], sel: Selections): SummaryLine[] {
  const lines: SummaryLine[] = [];
  for (const g of groups) {
    if (!groupVisible(g, sel)) continue;
    const v = g.values.find((x) => x.key === String(sel[g.key]));
    if (!v) continue;
    lines.push({ label: g.label, value: v.detail && g.key === "size" ? `${v.label} (${v.detail.toLowerCase()})` : v.detail && g.key === "layout" ? `${v.label} (${v.detail})` : v.label });
  }
  const cd = CUSTOM_DIMS[conf];
  if (cd && String(sel[cd.group]) === cd.value) {
    const parts = cd.fields.map((f) => `${f.label.toLowerCase()} ${sel[f.key]} ${f.unit}`);
    lines.push({ label: "Custom dimensions", value: parts.join(", ") });
  }
  return lines;
}

export function summaryText(lines: SummaryLine[]): string {
  return lines.map((l) => `${l.label}: ${l.value}`).join("; ");
}

/** Encode selections into URL query so a design can be restored without a save. */
export function selectionsToQuery(sel: Selections): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sel)) p.set(k, String(v));
  return p.toString();
}
