import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listEnquiries } from "@/lib/repo";
import { ENQUIRY_STATUSES, statusLabel } from "@/lib/constants";
import { formatDate } from "@/lib/util";

export const metadata = { title: "Enquiries" };
type SP = { status?: string; q?: string; type?: string; from?: string; to?: string; due?: string };

export default async function Enquiries({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = listEnquiries({ status: sp.status, q: sp.q?.trim(), type: sp.type, from: sp.from, to: sp.to, due: !!sp.due });
  return (
    <>
      <h1>Enquiries</h1>
      <form className="filters" role="search">
        <div className="field"><label htmlFor="q">Search</label><input className="input" id="q" name="q" defaultValue={sp.q} placeholder="Name, phone, product, reference" /></div>
        <div className="field"><label htmlFor="status">Status</label><select className="select" id="status" name="status" defaultValue={sp.status ?? ""}><option value="">All</option>{ENQUIRY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
        <div className="field"><label htmlFor="type">Type</label><select className="select" id="type" name="type" defaultValue={sp.type ?? ""}><option value="">All</option><option value="visit">Visit request</option><option value="configuration">Configuration</option><option value="product">Product</option><option value="quote">Quotation</option><option value="order_intent">Ready to order</option><option value="general">General</option></select></div>
        <div className="field"><label htmlFor="from">From</label><input className="input" type="date" id="from" name="from" defaultValue={sp.from} /></div>
        <div className="field"><label htmlFor="to">To</label><input className="input" type="date" id="to" name="to" defaultValue={sp.to} /></div>
        <label className="small" style={{ display: "flex", gap: 6, alignItems: "center", minHeight: 42 }}><input type="checkbox" name="due" value="1" defaultChecked={!!sp.due} /> Follow-up due</label>
        <button className="btn sm">Filter</button>
        <Link className="btn sm ghost" href="/admin/enquiries">Reset</Link>
      </form>
      {rows.length ? (
        <table className="tbl">
          <thead><tr><th>#</th><th>Received</th><th>Customer</th><th>About</th><th>Intent</th><th>Status</th><th>Follow-up</th></tr></thead>
          <tbody>{rows.map((e) => (
            <tr key={e.id}>
              <td>{String(e.id).padStart(4, "0")}</td><td>{formatDate(e.created_at)}</td>
              <td><Link href={`/admin/enquiries/${e.id}`}>{e.name}</Link><br /><span className="muted small">{e.phone}</span></td>
              <td>{e.type === "visit" ? <>Visit request{e.preferred_date ? ` · ${e.preferred_date}` : ""}</> : e.product_name || "—"}{e.config_ref && <><br /><code className="small">{e.config_ref}</code></>}</td>
              <td>{e.intent}</td>
              <td><span className={`chip ${e.status === "new" ? "warn" : e.status === "converted" ? "ok" : e.status === "lost" ? "bad" : ""}`}>{statusLabel(e.status)}</span></td>
              <td>{e.follow_up_date || "—"}</td>
            </tr>))}</tbody>
        </table>
      ) : <div className="empty"><h3>No enquiries match</h3><p>Try clearing the filters.</p></div>}
    </>
  );
}
