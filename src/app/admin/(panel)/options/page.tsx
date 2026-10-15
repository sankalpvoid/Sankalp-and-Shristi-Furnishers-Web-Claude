import { requireAdmin } from "@/lib/auth";
import { CONFIGURATORS } from "@/lib/constants";
import { getOptionGroups, getRules } from "@/lib/repo";
import { addOptionValue, addRule, deleteOptionValue, deleteRule, saveOptionValue, toggleGroup } from "../../actions";
import type { ConfiguratorType } from "@/lib/types";

export const metadata = { title: "Configurator options" };

export default async function Options({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const confs = Object.keys(CONFIGURATORS) as ConfiguratorType[];
  const conf = (confs.includes(sp.c as ConfiguratorType) ? sp.c : "bed") as ConfiguratorType;
  const groups = getOptionGroups(conf, { includeDisabled: true });
  const rules = getRules(conf);
  const choices = groups.flatMap((g) => g.values.map((v) => ({ val: `${g.key}:${v.key}`, label: `${g.label}: ${v.label}` })));
  return (
    <>
      <h1>Configurator options</h1>
      <p className="muted">Everything customers can choose. Start-up values are suggestions — untick “Confirmed offered” items you haven&apos;t verified, and disable anything you can&apos;t make.</p>
      <div className="filter-bar">{confs.map((c) => <a key={c} className="pill" href={`?c=${c}`} aria-current={c === conf ? "true" : undefined}>{CONFIGURATORS[c].label}</a>)}</div>
      {groups.map((g) => (
        <div className="panel" key={g.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>{g.label}</h2>
            <form action={toggleGroup} className="row"><input type="hidden" name="id" value={g.id} /><label className="small"><input type="checkbox" name="enabled" defaultChecked={!!g.enabled} /> Show this option</label><button className="btn sm ghost">Apply</button></form>
          </div>
          <table className="tbl"><thead><tr><th>Label</th><th>Detail</th>{g.kind === "swatch" && <th>Colour</th>}<th>Order</th><th>Available</th><th>Confirmed offered</th><th></th></tr></thead><tbody>
            {g.values.map((v) => (
              <tr key={v.id}>
                <td colSpan={7} style={{ padding: 0 }}>
                  <form action={saveOptionValue} style={{ display: "grid", gridTemplateColumns: g.kind === "swatch" ? "1.2fr 1.4fr 110px 70px 90px 130px auto" : "1.2fr 1.4fr 70px 90px 130px auto", gap: 8, alignItems: "center", padding: "8px 12px" }}>
                    <input type="hidden" name="id" value={v.id} />
                    <input className="input" name="label" defaultValue={v.label} aria-label="Label" />
                    <input className="input" name="detail" defaultValue={v.detail} aria-label="Detail" />
                    {g.kind === "swatch" ? <input className="input" name="swatch" defaultValue={v.swatch} aria-label="Colour hex" /> : <input type="hidden" name="swatch" value={v.swatch} />}
                    <input className="input" name="sort_order" type="number" defaultValue={v.sort_order} aria-label="Order" />
                    <label className="small"><input type="checkbox" name="enabled" defaultChecked={!!v.enabled} /> On</label>
                    <label className="small"><input type="checkbox" name="verified" defaultChecked={!!v.verified} /> Confirmed</label>
                    <span className="row"><button className="btn sm">Save</button><button className="btn sm ghost" formAction={deleteOptionValue} style={{ color: "var(--bad)" }}>Delete</button></span>
                  </form>
                </td>
              </tr>
            ))}
          </tbody></table>
          <form action={addOptionValue} className="row" style={{ marginTop: 12 }}><input type="hidden" name="group_id" value={g.id} /><input className="input" name="label" placeholder="New value" style={{ maxWidth: 220 }} required />{g.kind === "swatch" && <input className="input" name="swatch" placeholder="#b98a52" style={{ maxWidth: 120 }} />}<input className="input" name="detail" placeholder="Detail (optional)" style={{ maxWidth: 240 }} /><button className="btn sm">Add</button></form>
        </div>
      ))}
      <div className="panel">
        <h2>Unavailable combinations</h2>
        <p className="small muted">“If customer picks A, then B is not available.” New values added above still need the preview to know about them — colours and sizes work automatically; new shapes or styles will show as the closest existing preview.</p>
        {rules.length ? <table className="tbl"><tbody>{rules.map((r) => <tr key={r.id}><td>If <b>{r.if_group} = {r.if_value}</b> then <b>{r.then_group} = {r.then_value}</b> is unavailable<br /><span className="muted small">{r.note}</span></td><td><form action={deleteRule}><input type="hidden" name="id" value={r.id} /><button className="btn sm ghost">Remove</button></form></td></tr>)}</tbody></table> : <p className="muted">No rules.</p>}
        <form action={addRule} className="row" style={{ marginTop: 14 }}>
          <input type="hidden" name="configurator" value={conf} />
          <select className="select" name="if" style={{ maxWidth: 260 }} aria-label="If">{choices.map((c) => <option key={c.val} value={c.val}>{c.label}</option>)}</select>
          <span>then not</span>
          <select className="select" name="then" style={{ maxWidth: 260 }} aria-label="Then not available">{choices.map((c) => <option key={c.val} value={c.val}>{c.label}</option>)}</select>
          <input className="input" name="note" placeholder="Note (optional)" style={{ maxWidth: 220 }} /><button className="btn sm">Add rule</button>
        </form>
      </div>
    </>
  );
}
