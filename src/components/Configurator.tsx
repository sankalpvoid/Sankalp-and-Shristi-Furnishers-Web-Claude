"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Art } from "./art";
import { availableValues, buildSummary, CUSTOM_DIMS, defaultSelections, groupVisible, normalise, summaryText } from "@/lib/configurator";
import { previewArt } from "@/lib/preview";
import { INTENTS, configuratorSlug } from "@/lib/constants";
import { shortlist } from "@/lib/shortlist";
import type { ConfiguratorType, OptionGroup, OptionRule, Selections, SummaryLine } from "@/lib/types";

interface Props {
  conf: ConfiguratorType;
  label: string;
  groups: OptionGroup[];
  rules: OptionRule[];
  limits: Record<string, string[]>;
  preset: Selections;
  productId?: number;
  productName?: string;
  waNumber: string;
  startNote?: string;
}

export function Configurator({ conf, label, groups, rules, limits, preset, productId, productName, waNumber, startNote }: Props) {
  const [sel, setSel] = useState<Selections>(() => defaultSelections(groups, rules, limits, preset));
  const [open, setOpen] = useState(false); // sofa-cum-bed preview state
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<null | { ref: string; summary: SummaryLine[] }>(null);
  const [toast, setToast] = useState("");
  const cd = CUSTOM_DIMS[conf];

  const art = useMemo(() => previewArt(conf, groups, sel), [conf, groups, sel]);
  const summary = useMemo(() => buildSummary(conf, groups, sel), [conf, groups, sel]);

  function choose(key: string, value: string) {
    setSaved(null);
    setSel((cur) => {
      const next = normalise(groups, rules, { ...cur, [key]: value }, limits);
      if (cd && key === cd.group && value === cd.value) cd.fields.forEach((f) => { next[f.key] = cur[f.key] ?? (f.key === "custom_length" ? 78 : 60); });
      return next;
    });
  }
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  async function save() {
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/configurations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ configurator: conf, productId, selections: sel, notes }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) setErr(data?.error || "We couldn't save your design. Please try again.");
      else {
        setSaved({ ref: data.ref, summary: data.summary });
        shortlist.toggle({ kind: "config", key: data.ref, name: `${label} design ${data.ref}`, href: `/design/saved/${data.ref}` });
      }
    } catch { setErr("Network problem — your design was NOT saved. Please try again."); }
    setSaving(false);
  }

  const link = saved && typeof window !== "undefined" ? `${window.location.origin}/design/saved/${saved.ref}` : "";
  async function copy(text: string, msg: string) {
    try { await navigator.clipboard.writeText(text); flash(msg); } catch { flash("Copy failed — select the text and copy it manually"); }
  }
  async function share() {
    if (!saved) return;
    const text = `My ${label.toLowerCase()} design (${saved.ref})`;
    if (navigator.share) { try { await navigator.share({ title: text, text, url: link }); } catch { /* cancelled */ } }
    else copy(link, "Link copied");
  }
  const waText = saved ? `Hello, I saved a ${label.toLowerCase()} design on your website. Reference: ${saved.ref}. ${summaryText(saved.summary)}. Link: ${link}` : "";
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : "";

  return (
    <div className="cfg">
      <div className="cfg-stage">
        <div className="stage">
          <Art art={art} open={conf === "sofa_bed" ? open : undefined} tone="ivory" label={`Illustrative preview of your ${label.toLowerCase()} design`} />
          <span className="stage-badge">Illustrative preview · not 3D</span>
          {conf === "sofa_bed" && (
            <div className="stage-ctl">
              <button aria-pressed={!open} onClick={() => setOpen(false)}>Sofa</button>
              <button aria-pressed={open} onClick={() => setOpen(true)}>Bed</button>
            </div>
          )}
        </div>
        <div className="cfg-sum" aria-live="polite">
          <ul>{summary.map((l) => <li key={l.label}><span>{l.label}</span>{l.value}</li>)}</ul>
        </div>
      </div>

      <div className="cfg-panel">
        {startNote && <div className="notice">{startNote}</div>}
        {groups.filter((g) => groupVisible(g, sel)).map((g) => {
          const avail = availableValues(g, sel, rules, limits);
          return (
            <fieldset className="opt-group" key={g.key}>
              <legend>{g.label}</legend>
              {g.help && <p className="help">{g.help}</p>}
              <div className="opts">
                {g.values.filter((v) => !limits[g.key]?.length || limits[g.key].includes(v.key)).map((v) => (
                  <label key={v.key} className={`opt ${g.kind === "swatch" ? "sw" : ""}`}>
                    <input type="radio" name={g.key} value={v.key} checked={String(sel[g.key]) === v.key} disabled={!avail.has(v.key)} onChange={() => choose(g.key, v.key)} />
                    <span className="face">
                      {g.kind === "swatch" && <span className="sw-dot" style={{ background: v.swatch }} />}
                      <span>{v.label}{v.detail && g.kind !== "swatch" && <small>{v.detail}</small>}</span>
                    </span>
                  </label>
                ))}
              </div>
              {cd && g.key === cd.group && String(sel[cd.group]) === cd.value && (
                <div className="dims">
                  {cd.fields.map((f) => (
                    <div className="field" key={f.key}>
                      <label htmlFor={f.key}>{f.label} ({f.unit})</label>
                      <input id={f.key} className="input" type="number" inputMode="decimal" min={f.min} max={f.max} value={String(sel[f.key] ?? "")} onChange={(e) => { setSaved(null); setSel((c) => ({ ...c, [f.key]: e.target.value === "" ? "" : Number(e.target.value) })); }} />
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          );
        })}

        <div className="notice">Options shown are indicative. The team confirms what can be made, the final size and the price. {productName ? <>Starting from: <b>{productName}</b>.</> : null}</div>

        <div className="save-panel">
          {!saved ? (
            <>
              <h3 style={{ marginTop: 0 }}>Save your design</h3>
              <p className="small">No account needed. You&apos;ll get a reference number and a link you can share or bring to the showroom.</p>
              <div className="field"><label htmlFor="notes">Notes for the team <span className="muted">(optional)</span></label><textarea id="notes" className="textarea" value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} placeholder="Room size, timing, anything you'd like us to know" /></div>
              {err && <div className="notice bad" role="alert" style={{ marginBottom: 0 }}>{err}</div>}
              <button className="btn block" style={{ marginTop: 16 }} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save design & get reference"}</button>
            </>
          ) : (
            <div role="status">
              <h3 style={{ marginTop: 0 }}>Design saved</h3>
              <div className="ref-box"><code>{saved.ref}</code><button className="btn sm ghost" onClick={() => copy(saved.ref, "Reference copied")}>Copy reference</button></div>
              <div className="row" style={{ marginBottom: 20 }}>
                <button className="btn sm ghost" onClick={() => copy(link, "Link copied")}>Copy link</button>
                <button className="btn sm ghost" onClick={share}>Share</button>
                {waHref && <a className="btn sm ghost" href={waHref} target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>}
              </div>
              <p className="small" style={{ marginBottom: 10 }}>What would you like to do next?</p>
              <div className="intent-grid">
                {INTENTS.map((i) => {
                  const href = i.value === "visit" ? `/showroom?config=${saved.ref}#plan` : i.value === "exploring" ? `/design/${configuratorSlug(conf)}` : `/contact?config=${saved.ref}&intent=${i.value}`;
                  return <Link key={i.value} href={href} className="intent"><b>{i.label}</b><small>{i.hint}</small></Link>;
                })}
              </div>
              <p className="small muted" style={{ marginTop: 14 }}>Saved designs don&apos;t include your contact details. Anyone with the link can see the design, so only share it with people you trust.</p>
            </div>
          )}
        </div>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
