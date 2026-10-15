import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Art } from "@/components/art";
import { CONFIGURATORS, INTENTS, configuratorSlug } from "@/lib/constants";
import { getConfiguration, getOptionGroups } from "@/lib/repo";
import { previewArt } from "@/lib/preview";
import { parseJson, formatDay } from "@/lib/util";
import type { Selections, SummaryLine } from "@/lib/types";

type P = { params: Promise<{ ref: string }> };
export const metadata: Metadata = { title: "Saved design", robots: { index: false } };

export default async function SavedDesign({ params }: P) {
  const c = getConfiguration((await params).ref);
  if (!c) notFound();
  const summary = parseJson<SummaryLine[]>(c.summary, []);
  const sel = parseJson<Selections>(c.selections, {});
  const art = previewArt(c.configurator, getOptionGroups(c.configurator, { includeDisabled: true }), sel);
  return (
    <div className="wrap">
      <div className="page-head">
        <span className="eyebrow">Saved design</span>
        <h1>{CONFIGURATORS[c.configurator].label} design</h1>
        <p className="lede">Reference <code style={{ fontWeight: 600 }}>{c.ref}</code> · saved {formatDay(c.created_at.slice(0, 10))}</p>
      </div>
      <div className="cfg">
        <div className="stage"><Art art={art} label="Illustrative preview of this design" /><span className="stage-badge">Illustrative preview · not 3D</span></div>
        <div>
          <dl className="kv" style={{ marginBottom: 24 }}>{summary.map((l) => <Fragment key={l.label}><dt>{l.label}</dt><dd>{l.value}</dd></Fragment>)}</dl>
          {c.notes && <div className="note"><small>Notes</small>{c.notes}</div>}
          <div className="notice">This page shows the design only — no contact details are stored with it. Final size, availability and price are confirmed by the showroom team.</div>
          <div className="intent-grid" style={{ margin: "20px 0" }}>
            {INTENTS.filter((i) => i.value !== "exploring").map((i) => (
              <Link key={i.value} className="intent" href={i.value === "visit" ? `/showroom?config=${c.ref}#plan` : `/contact?config=${c.ref}&intent=${i.value}`}><b>{i.label}</b><small>{i.hint}</small></Link>
            ))}
          </div>
          <Link className="btn ghost" href={`/design/${configuratorSlug(c.configurator)}?ref=${c.ref}`}>Edit this design</Link>
        </div>
      </div>
    </div>
  );
}
