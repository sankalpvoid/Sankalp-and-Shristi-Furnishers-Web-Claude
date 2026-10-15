import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminGetProduct, adminProductImages, getOptionGroups, listCategories, getProductLimits } from "@/lib/repo";
import { ActionForm } from "@/components/ActionForm";
import { AVAILABILITY, CONFIGURATORS, PRODUCT_SOURCES, PRODUCT_STATUSES, SALES_METHODS, VERIFICATIONS } from "@/lib/constants";
import { deleteProduct, deleteProductImage, makeMainImage, saveProduct, setProductStatus, uploadProductImage } from "../../../actions";
import { parseJson } from "@/lib/util";
import type { ConfiguratorType, ProductRow } from "@/lib/types";

export const metadata = { title: "Edit product" };

const blank = (): Partial<ProductRow> => ({ name: "", slug: "", status: "draft", source: "manual", verification: "needs_review", sales_method: "quote", availability: "enquire", price_visibility: "hidden", configurator: "", art: JSON.stringify({ kind: "sofa" }), sizes: "[]", colours: "[]", upholstery: "[]" });

export default async function ProductEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  const p = (isNew ? blank() : adminGetProduct(Number(id))) as ProductRow | undefined;
  if (!p) notFound();
  const created = (await searchParams).created;
  const cats = listCategories({ includeHidden: true });
  const images = isNew ? [] : adminProductImages(p.id);
  const limits = isNew ? {} : getProductLimits(p.id);
  const confs = Object.keys(CONFIGURATORS) as ConfiguratorType[];
  const list = (s: string) => parseJson<string[]>(s, []).join(", ");
  return (
    <>
      <p className="small"><Link href="/admin/products">← Products</Link></p>
      <h1>{isNew ? "New product" : p.name}</h1>
      {created && <div className="notice ok">Product created. Add photographs below.</div>}
      {!isNew && p.source === "proposed_seed" && <div className="notice warn">This is a <b>proposed seed product</b> — it is not from Tally and nothing about it has been confirmed. Check it, mark it verified, add photos and details, or unpublish it.</div>}
      {!isNew && p.source === "tally_import" && <div className="notice">Imported from an inventory file. Source reference: <code>{p.source_ref}</code>. Inventory quantity and rate are internal only.</div>}
      <ActionForm action={saveProduct} submitLabel={isNew ? "Create product" : "Save changes"} extra={!isNew && p.status === "published" ? <Link className="btn ghost" href={`/product/${p.slug}`} target="_blank">View on site ↗</Link> : null}>
        {!isNew && <input type="hidden" name="id" value={p.id} />}
        <div className="panel full"><h2>Basics</h2><div className="grid-form cols">
          <div className="field"><label htmlFor="name">Name</label><input className="input" id="name" name="name" defaultValue={p.name} required /></div>
          <div className="field"><label htmlFor="slug">URL slug</label><input className="input" id="slug" name="slug" defaultValue={p.slug} placeholder="auto from name" /></div>
          <div className="field"><label htmlFor="category_id">Category</label><select className="select" id="category_id" name="category_id" defaultValue={p.category_id ?? ""}><option value="">— none —</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label htmlFor="subcategory">Subcategory</label><input className="input" id="subcategory" name="subcategory" defaultValue={p.subcategory} /></div>
          <div className="field"><label htmlFor="sku">SKU / item code</label><input className="input" id="sku" name="sku" defaultValue={p.sku} /></div>
          <div className="field"><label htmlFor="short_description">Short description</label><input className="input" id="short_description" name="short_description" defaultValue={p.short_description} /></div>
          <div className="field full"><label htmlFor="description">Detailed description</label><textarea className="textarea" id="description" name="description" defaultValue={p.description} rows={5} /></div>
          <label className="small full" style={{ display: "flex", gap: 8 }}><input type="checkbox" name="featured" defaultChecked={!!p.featured} /> Feature on the homepage</label>
        </div></div>

        <div className="panel full"><h2>Publishing &amp; verification</h2><div className="grid-form cols">
          <div className="field"><label htmlFor="status">Status</label><select className="select" id="status" name="status" defaultValue={p.status}>{PRODUCT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select><span className="hint">Only “Published” appears on the website.</span></div>
          <div className="field"><label htmlFor="verification">Verification</label><select className="select" id="verification" name="verification" defaultValue={p.verification}>{VERIFICATIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select><span className="hint">Unverified products show a “sample design” notice to customers.</span></div>
          <div className="field"><label htmlFor="source">Source of this record</label><select className="select" id="source" name="source" defaultValue={p.source}>{PRODUCT_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <div className="field"><label htmlFor="availability">Availability shown</label><select className="select" id="availability" name="availability" defaultValue={p.availability}>{AVAILABILITY.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
        </div></div>

        <div className="panel full"><h2>Pricing &amp; sales</h2><div className="grid-form cols">
          <div className="field"><label htmlFor="sales_method">Sales method</label><select className="select" id="sales_method" name="sales_method" defaultValue={p.sales_method}>{SALES_METHODS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <div className="field"><label htmlFor="price_inr">Customer-facing price (₹)</label><input className="input" id="price_inr" name="price_inr" type="number" min="0" step="1" defaultValue={p.price_inr ?? ""} /></div>
          <div className="field"><label htmlFor="price_visibility">Price visibility</label><select className="select" id="price_visibility" name="price_visibility" defaultValue={p.price_visibility}><option value="hidden">Hidden — “price on request”</option><option value="show">Show price publicly</option></select><span className="hint">Shown only if sales method is “Fixed price”.</span></div>
          <div className="field"><label htmlFor="quantity">Stock quantity (internal only)</label><input className="input" id="quantity" name="quantity" type="number" defaultValue={p.quantity ?? ""} /><span className="hint">Never shown on the website.</span></div>
          <label className="small full" style={{ display: "flex", gap: 8 }}><input type="checkbox" name="online_purchase_approved" defaultChecked={!!p.online_purchase_approved} /> Owner approves this product for future online purchase (checkout is not active yet)</label>
        </div></div>

        <div className="panel full"><h2>Details</h2><div className="grid-form cols">
          <div className="field"><label htmlFor="material">Material</label><input className="input" id="material" name="material" defaultValue={p.material} /><span className="hint">Say exactly what this product is made from. Don&apos;t claim solid teak unless true for this piece.</span></div>
          <div className="field"><label htmlFor="finish">Finish</label><input className="input" id="finish" name="finish" defaultValue={p.finish} /></div>
          <div className="field"><label htmlFor="dimensions">Dimensions</label><input className="input" id="dimensions" name="dimensions" defaultValue={p.dimensions} /></div>
          <div className="field"><label htmlFor="warranty_text">Guarantee wording for this product</label><input className="input" id="warranty_text" name="warranty_text" defaultValue={p.warranty_text} /><span className="hint">Leave blank unless verified.</span></div>
          <div className="field"><label htmlFor="sizes">Available sizes</label><input className="input" id="sizes" name="sizes" defaultValue={list(p.sizes)} /><span className="hint">Comma separated</span></div>
          <div className="field"><label htmlFor="colours">Colour options</label><input className="input" id="colours" name="colours" defaultValue={list(p.colours)} /></div>
          <div className="field"><label htmlFor="upholstery">Upholstery options</label><input className="input" id="upholstery" name="upholstery" defaultValue={list(p.upholstery)} /></div>
          <div className="field"><label htmlFor="config_notes">Configuration notes</label><input className="input" id="config_notes" name="config_notes" defaultValue={p.config_notes} /></div>
        </div></div>

        <div className="panel full"><h2>Customisation</h2><div className="grid-form cols">
          <div className="field"><label htmlFor="configurator">Configurator</label><select className="select" id="configurator" name="configurator" defaultValue={p.configurator}><option value="">None — not customisable online</option>{confs.map((c) => <option key={c} value={c}>{CONFIGURATORS[c].label}</option>)}</select></div>
          <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="customisable" defaultChecked={!!p.customisable} /> Customisable (enquiry only, without a configurator)</label>
          {p.configurator && (
            <div className="full"><h3>Restrict options for this product</h3><p className="small muted">Tick the values this product offers. Leave a group with nothing ticked to allow everything.</p>
              {getOptionGroups(p.configurator as ConfiguratorType).map((g) => (
                <fieldset key={g.key} className="field" style={{ border: 0, padding: 0, margin: "0 0 10px" }}><legend>{g.label}</legend>
                  <div className="checks">{g.values.map((v) => <label key={v.key} className="check"><input type="checkbox" name={`limit__${g.key}`} value={v.key} defaultChecked={limits[g.key]?.includes(v.key)} /><span>{v.label}</span></label>)}</div>
                </fieldset>
              ))}
            </div>
          )}
        </div></div>

        <div className="panel full"><h2>Placeholder illustration &amp; internal</h2><div className="grid-form cols">
          <div className="field full"><label htmlFor="art">Illustration settings (JSON)</label><textarea className="textarea" id="art" name="art" rows={2} defaultValue={p.art} /><span className="hint">Used only when the product has no photograph. e.g. {`{"kind":"sofa","layout":"three","wood":"#6e4a2f","fabric":"#b3aa9b"}`}</span></div>
          <div className="field"><label htmlFor="model_url">3D model URL (future)</label><input className="input" id="model_url" name="model_url" defaultValue={p.model_url} /><span className="hint">Reserved for future interactive 3D. Not used yet.</span></div>
          <div className="field full"><label htmlFor="internal_notes">Internal notes</label><textarea className="textarea" id="internal_notes" name="internal_notes" rows={3} defaultValue={p.internal_notes} /></div>
        </div></div>
      </ActionForm>

      {!isNew && (
        <>
          <div className="panel"><h2>Photographs</h2>
            {images.length === 0 && <div className="notice warn">No photograph yet — the site shows a labelled illustration instead.</div>}
            <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
              {images.map((im, i) => (
                <div key={im.id} style={{ width: 170 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url} alt={im.alt} style={{ width: 170, height: 128, objectFit: "cover" }} />
                  <div className="small">{i === 0 ? <b>Main image</b> : <form action={makeMainImage}><input type="hidden" name="id" value={im.id} /><input type="hidden" name="product_id" value={p.id} /><button className="btn sm ghost">Make main</button></form>}</div>
                  <form action={deleteProductImage}><input type="hidden" name="id" value={im.id} /><button className="btn sm ghost" style={{ color: "var(--bad)", marginTop: 6 }}>Remove</button></form>
                </div>
              ))}
            </div>
            <h3 style={{ marginTop: 24 }}>Add a photograph</h3>
            <ActionForm action={uploadProductImage} submitLabel="Upload" encType="multipart/form-data">
              <input type="hidden" name="product_id" value={p.id} />
              <div className="field"><label htmlFor="file">Image (JPG, PNG, WebP)</label><input className="input" id="file" name="file" type="file" accept="image/*" required /></div>
              <div className="field"><label htmlFor="alt">Description for screen readers</label><input className="input" id="alt" name="alt" /></div>
            </ActionForm>
          </div>
          <div className="panel"><h2>Quick actions</h2><form action={setProductStatus} className="row"><input type="hidden" name="id" value={p.id} />
            <button className="btn sm ghost" name="status" value="unpublished">Unpublish</button><button className="btn sm ghost" name="status" value="archived">Archive</button></form>
            <form action={deleteProduct} style={{ marginTop: 14 }}><input type="hidden" name="id" value={p.id} /><button className="btn sm ghost" style={{ color: "var(--bad)" }}>Delete permanently</button><span className="small muted"> Prefer Archive — enquiries keep the product name either way.</span></form>
          </div>
        </>
      )}
    </>
  );
}
