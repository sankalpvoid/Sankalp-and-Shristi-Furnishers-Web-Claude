import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { ActionForm } from "@/components/ActionForm";
import { runImport } from "../../actions";
import { formatDate } from "@/lib/util";

export const metadata = { title: "Import inventory" };

export default async function ImportPage() {
  await requireAdmin();
  const runs = db().prepare("SELECT * FROM import_sources ORDER BY id DESC LIMIT 10").all() as { id: number; filename: string; rows_total: number; rows_imported: number; rows_skipped: number; report: string; imported_at: string }[];
  return (
    <>
      <h1>Import inventory</h1>
      <div className="notice warn"><b>No Tally export was available when this website was built</b>, so the catalogue contains only clearly-labelled sample products. Upload your real export here (or use the template) to start from your actual stock.</div>
      <div className="panel">
        <h2>Upload a CSV</h2>
        <ol className="small"><li>In Tally, export <i>Stock Summary</i> (or Stock Items) to CSV/Excel. If you have Excel, use Save As → CSV (UTF-8).</li><li>Upload it below. Columns like <i>Name / Particulars, Stock Group, Closing Balance, Part No</i> are recognised. Our <a href="/templates/ssfi-catalogue-import-template.csv">template</a> shows every supported column.</li><li>Imported items arrive as <b>Needs review</b>, hidden from the website, with prices hidden. Quantities and rates stay internal.</li></ol>
        <ActionForm action={runImport} submitLabel="Import" encType="multipart/form-data"><div className="field full"><input className="input" type="file" name="file" accept=".csv,text/csv" required aria-label="CSV file" /></div></ActionForm>
      </div>
      <div className="panel">
        <h2>Previous imports</h2>
        {runs.length ? runs.map((r) => <details key={r.id} style={{ marginBottom: 10 }}><summary>{r.filename} · {formatDate(r.imported_at)} · {r.rows_imported} imported, {r.rows_skipped} skipped</summary><pre className="small" style={{ whiteSpace: "pre-wrap" }}>{r.report}</pre></details>) : <p className="muted">None yet.</p>}
      </div>
    </>
  );
}
