import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";
import { enquiryCounts } from "@/lib/repo";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const c = enquiryCounts();
  return (
    <div className="admin">
      <nav className="admin-nav dark" aria-label="Admin">
        <div className="head">Admin</div>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/enquiries">Enquiries {c.byStatus.new ? <span className="chip gold">{c.byStatus.new}</span> : null}</Link>
        <Link href="/admin/configurations">Saved designs</Link>
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/categories">Categories</Link>
        <Link href="/admin/options">Configurator options</Link>
        <Link href="/admin/settings">Brand &amp; contact</Link>
        <Link href="/admin/import">Import inventory</Link>
        <div className="grow" />
        <Link href="/" target="_blank">View website ↗</Link>
        <form action={logout}><button className="btn sm ghost block" style={{ marginTop: 8 }}>Sign out ({user})</button></form>
      </nav>
      <div className="admin-main">{children}</div>
    </div>
  );
}
