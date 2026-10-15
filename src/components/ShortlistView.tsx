"use client";
import Link from "next/link";
import { shortlist, useShortlist } from "@/lib/shortlist";

export function ShortlistView() {
  const list = useShortlist();
  if (!list.length) return (
    <div className="empty"><h3>Your shortlist is empty</h3><p>Save products and designs as you browse, then bring the list to the showroom.</p><Link className="btn" href="/shop">Explore furniture</Link></div>
  );
  return (
    <div>
      <table className="tbl" style={{ background: "transparent" }}>
        <tbody>
          {list.map((i) => (
            <tr key={i.key}>
              <td><span className="chip line">{i.kind === "config" ? "Your design" : "Product"}</span></td>
              <td><Link href={i.href}>{i.name}</Link></td>
              <td style={{ textAlign: "right" }}><button className="btn sm ghost" onClick={() => shortlist.remove(i.key)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ marginTop: 28 }}>
        <Link className="btn" href="/showroom#plan">Plan a visit with this list</Link>
        <Link className="btn ghost" href="/contact">Send an enquiry</Link>
        <button className="btn ghost" onClick={() => shortlist.clear()}>Clear all</button>
      </div>
      <p className="small muted" style={{ marginTop: 16 }}>Your shortlist is kept in this browser only — it isn&apos;t sent to us until you submit a form.</p>
    </div>
  );
}
