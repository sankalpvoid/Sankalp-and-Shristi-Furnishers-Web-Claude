import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { enquiryNotes, getConfiguration, getEnquiry } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { ENQUIRY_STATUSES, INTENTS } from "@/lib/constants";
import { addNote, deleteEnquiry, setEnquiryStatus, updateEnquiry } from "../../../actions";
import { formatDate, parseJson } from "@/lib/util";
import type { SummaryLine } from "@/lib/types";
import { db } from "@/db";

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const e = getEnquiry(Number((await params).id));
  if (!e) notFound();
  const s = getSettings();
  const notes = enquiryNotes(e.id);
  const cfg = e.config_ref ? getConfiguration(e.config_ref) : undefined;
  const summary = cfg ? parseJson<SummaryLine[]>(cfg.summary, []) : [];
  const product = e.product_id ? (db().prepare("SELECT id, name, slug, status FROM products WHERE id=?").get(e.product_id) as { id: number; name: string; slug: string; status: string } | undefined) : undefined;
  const digits = e.phone.replace(/\D/g, "");
  const waNum = digits.length === 10 ? "91" + digits : digits;
  const waMsg = `Hello ${e.name}, this is ${s.brand.name}. Thank you for your enquiry${e.product_name ? ` about ${e.product_name}` : ""}${e.config_ref ? ` (design ${e.config_ref})` : ""}.`;
  const shortlist = parseJson<string[]>(e.shortlist, []);
  const cats = parseJson<string[]>(e.categories, []);
  return (
    <>
      <p className="small"><Link href="/admin/enquiries">← All enquiries</Link></p>
      <h1>Enquiry {String(e.id).padStart(4, "0")} · {e.name}</h1>
      <div className="two-col">
        <div>
          <div className="panel">
            <h2>Customer</h2>
            <dl className="kv">
              <dt>Name</dt><dd>{e.name}</dd>
              <dt>Phone</dt><dd>{e.phone}</dd>
              <dt>Email</dt><dd>{e.email || "—"}</dd>
              <dt>Prefers</dt><dd>{e.contact_method}</dd>
              <dt>Received</dt><dd>{formatDate(e.created_at)}</dd>
              <dt>Type / intent</dt><dd>{e.type} · {INTENTS.find((i) => i.value === e.intent)?.label}</dd>
              {e.preferred_date ? <><dt>Preferred visit</dt><dd>{e.preferred_date}</dd></> : null}
              {cats.length > 0 && <><dt>Interested in</dt><dd>{cats.join(", ")}</dd></>}
            </dl>
            <div className="row" style={{ marginTop: 18 }}>
              <a className="btn sm" href={`tel:+${waNum.startsWith("91") ? waNum : digits}`}>Call</a>
              <a className="btn sm ghost" href={`https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              {e.email && <a className="btn sm ghost" href={`mailto:${e.email}?subject=${encodeURIComponent(`Your enquiry — ${s.brand.name}`)}`}>Email</a>}
            </div>
          </div>
          {(product || cfg || e.message) && (
            <div className="panel">
              <h2>What they asked for</h2>
              {e.message && <div className="note"><small>Message</small>{e.message}</div>}
              {product && <p><b>Product:</b> <Link href={`/admin/products/${product.id}`}>{product.name}</Link> {product.status === "published" && <Link href={`/product/${product.slug}`} target="_blank">view on site ↗</Link>}</p>}
              {cfg && (
                <>
                  <p><b>Saved design:</b> <code>{cfg.ref}</code> · <Link href={`/design/saved/${cfg.ref}`} target="_blank">open preview ↗</Link></p>
                  <dl className="kv">{summary.map((l) => <Fragment key={l.label}><dt>{l.label}</dt><dd>{l.value}</dd></Fragment>)}</dl>
                  {cfg.notes && <div className="note"><small>Design notes</small>{cfg.notes}</div>}
                </>
              )}
              {e.config_ref && !cfg && <p className="err">Reference {e.config_ref} could not be found.</p>}
              {shortlist.length > 0 && <><h3>Shortlist they attached</h3><ul>{shortlist.map((x) => <li key={x}>{x}</li>)}</ul></>}
            </div>
          )}
          <div className="panel">
            <h2>Internal notes</h2>
            <form action={addNote} className="form"><input type="hidden" name="id" value={e.id} /><div className="field"><label htmlFor="body">Add a note</label><textarea className="textarea" id="body" name="body" required maxLength={2000} /></div><div><button className="btn sm">Add note</button></div></form>
            {notes.map((n) => <div className="note" key={n.id}><small>{n.author} · {formatDate(n.created_at)}</small>{n.body}</div>)}
          </div>
        </div>
        <div>
          <div className="panel">
            <h2>Status</h2>
            <div className="pipeline" style={{ marginBottom: 18 }}>
              {ENQUIRY_STATUSES.map((st) => (
                <form action={setEnquiryStatus} key={st.value}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="status" value={st.value} /><button className={`step ${e.status === st.value ? "on" : ""}`} aria-pressed={e.status === st.value}>{st.label}</button></form>
              ))}
            </div>
            <form action={updateEnquiry} className="form">
              <input type="hidden" name="id" value={e.id} /><input type="hidden" name="status" value={e.status} />
              <div className="field"><label htmlFor="assigned_to">Assigned to</label><input className="input" id="assigned_to" name="assigned_to" defaultValue={e.assigned_to} /></div>
              <div className="field"><label htmlFor="follow_up_date">Follow-up date</label><input className="input" type="date" id="follow_up_date" name="follow_up_date" defaultValue={e.follow_up_date} /></div>
              <div><button className="btn sm">Save assignment &amp; follow-up</button></div>
            </form>
          </div>
          <form action={deleteEnquiry}><input type="hidden" name="id" value={e.id} /><button className="btn sm ghost" style={{ color: "var(--bad)" }}>Delete this enquiry</button></form>
        </div>
      </div>
    </>
  );
}
