import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "var(--gutter)", background: "var(--paper)" }}>
      <div style={{ maxWidth: 560 }}>
        <span className="eyebrow">Page not found</span>
        <h1 style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}>We can&apos;t find that page</h1>
        <p className="lede">It may have been moved, unpublished or never existed. Let&apos;s get you back to the furniture.</p>
        <div className="row" style={{ marginTop: 28 }}>
          <Link className="btn" href="/shop">Explore Furniture</Link>
          <Link className="btn ghost" href="/">Home</Link>
        </div>
      </div>
    </main>
  );
}
