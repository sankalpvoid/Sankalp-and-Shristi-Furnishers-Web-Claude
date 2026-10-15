import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { getCategoryBySlug, listCategories, listPublishedProducts } from "@/lib/repo";

type P = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = getCategoryBySlug((await params).category);
  return { title: c?.name ?? "Category" };
}

export default async function CategoryPage({ params }: P) {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat || !cat.visible) notFound();
  const cats = listCategories();
  const products = listPublishedProducts({ categorySlug: category });
  return (
    <div className="wrap">
      <div className="page-head">
        <div className="crumbs"><Link href="/">Home</Link> / <Link href="/shop">Furniture</Link> / {cat.name}</div>
        <h1>{cat.name}</h1>
        {cat.description && <p className="lede">{cat.description}</p>}
      </div>
      <nav className="filter-bar" aria-label="Categories">
        <Link className="pill" href="/shop">All</Link>
        {cats.map((c) => <Link key={c.slug} className="pill" href={`/shop/${c.slug}`} aria-current={c.slug === category ? "true" : undefined}>{c.name}</Link>)}
      </nav>
      {products.length ? (
        <div className="p-grid four" style={{ paddingBottom: 100 }}>{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="empty" style={{ marginBottom: 100 }}>
          <h3>Ask us about {cat.name.toLowerCase()}</h3>
          <p>We haven&apos;t listed any {cat.name.toLowerCase()} online yet. Visit the showroom or send an enquiry and we&apos;ll show you what&apos;s available.</p>
          <Link className="btn" href={`/contact?about=${encodeURIComponent(cat.name)}`}>Send an enquiry</Link>
        </div>
      )}
    </div>
  );
}
