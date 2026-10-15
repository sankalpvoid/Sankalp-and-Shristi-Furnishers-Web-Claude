import { requireAdmin } from "@/lib/auth";
import { listCategories, productCountByCategory } from "@/lib/repo";
import { deleteCategory, saveCategory } from "../../actions";

export const metadata = { title: "Categories" };
const ART_KINDS = ["bed", "divan", "dressing", "chair", "sofa", "sofabed", "couch", "centretable", "stool", "dining", "diningchair", "mattress"];

function Fields({ c }: { c?: ReturnType<typeof listCategories>[number] }) {
  return (
    <div className="grid-form cols">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="field"><label>Name<input className="input" name="name" defaultValue={c?.name} required /></label></div>
      <div className="field"><label>Group<input className="input" name="group_name" defaultValue={c?.group_name ?? "Other"} /></label></div>
      <div className="field"><label>Slug<input className="input" name="slug" defaultValue={c?.slug} placeholder="auto" /></label></div>
      <div className="field"><label>Order<input className="input" name="sort_order" type="number" defaultValue={c?.sort_order ?? 100} /></label></div>
      <div className="field full"><label>Description<input className="input" name="description" defaultValue={c?.description} /></label></div>
      <div className="field"><label>Illustration style<select className="select" name="art_kind" defaultValue={c?.art_kind ?? "sofa"}>{ART_KINDS.map((k) => <option key={k}>{k}</option>)}</select></label></div>
      <div className="field"><label>Image URL (optional)<input className="input" name="image_url" defaultValue={c?.image_url} /></label></div>
      <label className="small" style={{ display: "flex", gap: 8 }}><input type="checkbox" name="visible" defaultChecked={c ? !!c.visible : true} /> Visible on website</label>
    </div>
  );
}

export default async function Categories() {
  await requireAdmin();
  const cats = listCategories({ includeHidden: true });
  const counts = productCountByCategory();
  return (
    <>
      <h1>Categories</h1>
      <p className="muted">Hidden categories disappear from the menu and their products stay off the site. A category appearing here does not mean stock exists.</p>
      {cats.map((c) => (
        <details key={c.id} className="panel">
          <summary><b>{c.name}</b> · {c.group_name} · {counts[c.id] ?? 0} published {c.visible ? "" : <span className="chip">Hidden</span>}</summary>
          <form action={saveCategory} style={{ marginTop: 16 }}><Fields c={c} /><div className="row" style={{ marginTop: 12 }}><button className="btn sm">Save</button></div></form>
          <form action={deleteCategory} style={{ marginTop: 10 }}><input type="hidden" name="id" value={c.id} /><button className="btn sm ghost" style={{ color: "var(--bad)" }}>Delete (products are kept, uncategorised)</button></form>
        </details>
      ))}
      <details className="panel" open={!cats.length}><summary><b>+ Add a category</b></summary><form action={saveCategory} style={{ marginTop: 16 }}><Fields /><div style={{ marginTop: 12 }}><button className="btn sm">Add category</button></div></form></details>
    </>
  );
}
