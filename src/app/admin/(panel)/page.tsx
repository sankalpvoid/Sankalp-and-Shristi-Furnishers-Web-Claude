import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { enquiryCounts, listEnquiries } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { ENQUIRY_STATUSES, statusLabel } from "@/lib/constants";
import { formatDate, formatDay } from "@/lib/util";

export default async function Dashboard() {
  await requireAdmin();
  const c = enquiryCounts();
  const s = getSettings();
  const due = listEnquiries({ due: true });
  const recent = listEnquiries({}).slice(0, 8);
  const conn = db();
  const prod = Object.fromEntries((conn.prepare("SELECT status, COUNT(*) n FROM products GROUP BY status").all() as { status: string; n: number }[]).map((r) => [r.status, r.n]));
  const unverifiedPublished = (conn.prepare("SELECT COUNT(*) n FROM products WHERE status='published' AND verification<>'verified'").get() as { n: number }).n;
  const todo: string[] = [];
  if (!s.contact.phone) todo.push("Add the showroom phone number");
  if (!s.contact.whatsapp) todo.push("Add the WhatsApp number (WhatsApp buttons stay hidden until set)");
  if (!s.contact.address) todo.push("Add the showroom address, hours and map link");
  if (!s.flags.legacyClaimVerified) todo.push("Verify the “oldest showroom on Ring Road / first in the market” claim, then tick it in Brand & contact");
  if (!s.flags.guaranteeVerified) todo.push("Confirm the five-year guarantee wording and terms");
  if (unverifiedPublished) todo.push(`${unverifiedPublished} published products are unverified sample designs — confirm, edit or unpublish them`);
  return (
    <>
      <h1>Dashboard</h1>
      <div className="stats">
        {ENQUIRY_STATUSES.slice(0, 4).map((st) => <Link key={st.value} className="stat" href={`/admin/enquiries?status=${st.value}`}><b>{c.byStatus[st.value] ?? 0}</b><span>{st.label}</span></Link>)}
        <Link className="stat" href="/admin/enquiries?due=1"><b>{c.due}</b><span>Follow-ups due</span></Link>
        <Link className="stat" href="/admin/products?status=published"><b>{prod.published ?? 0}</b><span>Published products</span></Link>
        <Link className="stat" href="/admin/products?status=needs_review"><b>{prod.needs_review ?? 0}</b><span>Products to review</span></Link>
      </div>
      <div className="two-col">
        <div className="panel">
          <h2>Latest enquiries</h2>
          {recent.length ? (
            <table className="tbl"><tbody>{recent.map((e) => (
              <tr key={e.id}><td><Link href={`/admin/enquiries/${e.id}`}>{e.name}</Link><br /><span className="muted small">{formatDate(e.created_at)}</span></td><td>{e.type === "visit" ? "Visit request" : e.product_name || e.config_ref || "General"}</td><td><span className={`chip ${e.status === "new" ? "warn" : ""}`}>{statusLabel(e.status)}</span></td></tr>
            ))}</tbody></table>
          ) : <p className="muted">No enquiries yet. They&apos;ll appear here as customers submit forms.</p>}
          {due.length > 0 && (<><h3 style={{ marginTop: 24 }}>Follow-ups due</h3><ul>{due.map((e) => <li key={e.id}><Link href={`/admin/enquiries/${e.id}`}>{e.name}</Link> — {formatDay(e.follow_up_date)}</li>)}</ul></>)}
        </div>
        <div className="panel">
          <h2>Before launch</h2>
          {todo.length ? <ul>{todo.map((t) => <li key={t}>{t}</li>)}</ul> : <p>Nothing outstanding.</p>}
          <p className="small muted">These items are placeholders or owner claims that must be confirmed before the site goes public.</p>
        </div>
      </div>
    </>
  );
}
