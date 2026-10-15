import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminListProducts, listCategories } from "@/lib/repo";
import { PRODUCT_SOURCES, PRODUCT_STATUSES } from "@/lib/constants";
import { setProductStatus } from "../../actions";
import { formatDay } from "@/lib/util";

export const metadata = { title: "Products" };
type SP = { status?: string; category?: string; source?: string; q?: string };
const srcLabel = (s: string) => PRODUCT_SOURCES.find((x) => x.value === s)?.label ?? s;

export default async function Products({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const cats = listCategories({ includeHidden: true });
  const rows = adminListProducts({ status: sp.status, categoryId: sp.category ? Number(sp.category) : undefined, source: sp.source, q: sp.q?.trim() });
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}><h1>Products</h1><Link className="btn" href="/admin/products/new">New product</Link></div>
      <form className="filters" role="search">
        <div className="field"><label htmlFor="q">Search</label><input className="input" id="q" name="q" defaultValue={sp.q} placeholder="Name or SKU" /></div>
        <div className="field"><label htmlFor="status">Status</label><select className="select" id="status" name="status" defaultValue={sp.status ?? ""}><option value="">All</option>{PRODUCT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
        <div className="field"><label htmlFor="category">Category</label><select className="select" id="category" name="category" defaultValue={sp.category ?? ""}><option value="">All</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="field"><label htmlFor="source">Source</label><select className="select" id="source" name="source" defaultValue={sp.source ?? ""}><option value="">All</option>{PRODUCT_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
        <button className="btn sm">Filter</button><Link className="btn sm ghost" href="/admin/products">Reset</Link>
      </form>
      <table className="tbl">
        <thead><tr><th>Product</th><th>Category</th><th>Status</th><th>Source</th><th>Verified</th><th>Price</th><th>Image</th><th>Updated</th><th></th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td><Link href={`/admin/products/${p.id}`}>{p.name}</Link>{p.featured ? <> <span className="chip gold">Featured</span></> : null}{p.sku && <><br /><span className="muted small">{p.sku}</span></>}</td>
              <td>{p.cat_name ?? <span className="chip warn">None</span>}</td>
              <td><span className={`chip ${p.status === "published" ? "ok" : p.status === "needs_review" ? "warn" : ""}`}>{PRODUCT_STATUSES.find((s) => s.value === p.status)?.label}</span></td>
              <td className="small">{srcLabel(p.source)}</td>
              <td><span className={`chip ${p.verification === "verified" ? "ok" : "warn"}`}>{p.verification.replace("_", " ")}</span></td>
              <td className="small">{p.price_visibility === "show" && p.price_inr ? `₹${p.price_inr} (public)` : "hidden"}</td>
              <td className="small">{p.img_count ? `${p.img_count} photo${p.img_count > 1 ? "s" : ""}` : <span className="chip warn">Placeholder</span>}</td>
              <td className="small">{formatDay(p.updated_at.slice(0, 10))}</td>
              <td>
                <form action={setProductStatus} className="row"><input type="hidden" name="id" value={p.id} />
                  {p.status === "published" ? <button className="btn sm ghost" name="status" value="unpublished">Unpublish</button> : p.status === "archived" ? <button className="btn sm ghost" name="status" value="draft">Restore</button> : p.verification === "verified" ? <button className="btn sm" name="status" value="published">Publish</button> : <Link className="btn sm ghost" href={`/admin/products/${p.id}`}>Review first</Link>}
                </form>
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={9} className="muted">No products match.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
