import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings } from "@/lib/settings";
import { listCategories } from "@/lib/repo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = getSettings();
  const cats = listCategories();
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <SiteHeader brand={s.brand} categories={cats.map((c) => ({ slug: c.slug, name: c.name, group_name: c.group_name }))} />
      <main id="main">{children}</main>
      <SiteFooter s={s} categories={cats} />
      <div className="mobile-bar">
        <Link className="btn sm ghost" href="/design">Design your own</Link>
        <Link className="btn sm" href="/contact">Enquire</Link>
      </div>
    </>
  );
}
