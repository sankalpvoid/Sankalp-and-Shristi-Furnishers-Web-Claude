import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { listCategories, listPublishedProducts } from "@/lib/repo";

export const metadata: Metadata = { title: "Explore Furniture" };

export default async function Shop({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const cats = listCategories();
  const products = listPublishedProducts({ q: q?.slice(0, 60) });
  return (
    <div className="wrap">
      <div className="page-head">
        <div className="crumbs"><Link href="/">Home</Link> / Furniture</div>
        <div className="head-split">
          <h1>Explore Furniture</h1>
          <p className="lede">Ready-made pieces and designs we can make to order. Prices and availability are confirmed by the showroom team.</p>
        </div>
      </div>
      <nav className="filter-bar" aria-label="Categories">
        <Link className="pill" href="/shop" aria-current={!q ? "true" : undefined}>All</Link>
        {cats.map((c) => <Link key={c.slug} className="pill" href={`/shop/${c.slug}`}>{c.name}</Link>)}
      </nav>
      <div className="list-tools">
        <span>{products.length} {products.length === 1 ? "design" : "designs"}{q ? ` for “${q}”` : ""}</span>
        <form action="/shop" className="row" role="search" style={{ gap: 8 }}>
          <label className="sr" htmlFor="q">Search furniture</label>
          <input id="q" name="q" className="input" defaultValue={q} placeholder="Search" style={{ width: 200, minHeight: 40, padding: "8px 12px" }} />
          <button className="btn sm" type="submit">Search</button>
        </form>
      </div>
      {products.length ? (
        <div className="p-grid" style={{ paddingBottom: 120 }}>{products.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 3} />)}</div>
      ) : (
        <div className="empty" style={{ marginBottom: 100 }}><h3>Nothing matches that search</h3><p>Try another word, or <Link href="/contact">ask the team</Link> — we may be able to make it.</p></div>
      )}
    </div>
  );
}
