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
        <h1>Explore Furniture</h1>
        <p className="lede">Ready-made pieces and designs we can make to order. Prices and availability are confirmed by the showroom team.</p>
      </div>
      <nav className="filter-bar" aria-label="Categories">
        <Link className="pill" href="/shop" aria-current={!q ? "true" : undefined}>All</Link>
        {cats.map((c) => <Link key={c.slug} className="pill" href={`/shop/${c.slug}`}>{c.name}</Link>)}
      </nav>
      <form action="/shop" className="row" style={{ marginBottom: 32 }} role="search">
        <label className="sr" htmlFor="q">Search furniture</label>
        <input id="q" name="q" className="input" defaultValue={q} placeholder="Search furniture" style={{ maxWidth: 360 }} />
        <button className="btn sm" type="submit">Search</button>
      </form>
      {products.length ? (
        <div className="p-grid four" style={{ paddingBottom: 100 }}>{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="empty" style={{ marginBottom: 100 }}><h3>Nothing matches that search</h3><p>Try another word, or <Link href="/contact">ask the team</Link> — we may be able to make it.</p></div>
      )}
    </div>
  );
}
