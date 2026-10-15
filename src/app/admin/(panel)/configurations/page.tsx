import Link from "next/link";
import { Fragment } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { getConfiguration } from "@/lib/repo";
import { CONFIGURATORS } from "@/lib/constants";
import { formatDate, parseJson } from "@/lib/util";
import type { ConfigurationRow, SummaryLine } from "@/lib/types";

export const metadata = { title: "Saved designs" };

export default async function Configs({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  await requireAdmin();
  const { ref } = await searchParams;
  const found = ref ? getConfiguration(ref) : undefined;
  const recent = db().prepare("SELECT * FROM configurations ORDER BY id DESC LIMIT 40").all() as ConfigurationRow[];
  const linked = found ? (db().prepare("SELECT id, name FROM enquiries WHERE config_ref=?").all(found.ref) as { id: number; name: string }[]) : [];
  return (
    <>
      <h1>Saved designs</h1>
      <form className="filters" role="search"><div className="field"><label htmlFor="ref">Look up by reference</label><input className="input" id="ref" name="ref" defaultValue={ref} placeholder="SSFI-BED-XXXXXX" /></div><button className="btn sm">Find</button></form>
      {ref && !found && <div className="notice bad">No saved design with reference “{ref}”.</div>}
      {found && (
        <div className="panel">
          <h2>{found.ref} · {CONFIGURATORS[found.configurator].label}</h2>
          <p className="small muted">Saved {formatDate(found.created_at)}</p>
          <dl className="kv">{parseJson<SummaryLine[]>(found.summary, []).map((l) => <Fragment key={l.label}><dt>{l.label}</dt><dd>{l.value}</dd></Fragment>)}</dl>
          {found.notes && <div className="note"><small>Customer notes</small>{found.notes}</div>}
          <p><Link href={`/design/saved/${found.ref}`} target="_blank">Open visual preview ↗</Link></p>
          <p>{linked.length ? <>Enquiries: {linked.map((l) => <Link key={l.id} href={`/admin/enquiries/${l.id}`} style={{ marginRight: 10 }}>#{String(l.id).padStart(4, "0")} {l.name}</Link>)}</> : <span className="muted">No enquiry linked to this design yet.</span>}</p>
        </div>
      )}
      <h2>Recently saved</h2>
      <table className="tbl"><thead><tr><th>Reference</th><th>Type</th><th>Saved</th><th>Summary</th></tr></thead><tbody>
        {recent.map((c) => <tr key={c.id}><td><Link href={`/admin/configurations?ref=${c.ref}`}>{c.ref}</Link></td><td>{CONFIGURATORS[c.configurator].label}</td><td>{formatDate(c.created_at)}</td><td className="small">{parseJson<SummaryLine[]>(c.summary, []).map((l) => l.value).join(" · ")}</td></tr>)}
        {!recent.length && <tr><td colSpan={4} className="muted">None yet.</td></tr>}
      </tbody></table>
    </>
  );
}
