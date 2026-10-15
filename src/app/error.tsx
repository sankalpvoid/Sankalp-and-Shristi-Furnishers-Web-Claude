"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "var(--gutter)", background: "var(--paper)" }}>
      <div style={{ maxWidth: 560 }}>
        <span className="eyebrow">Something went wrong</span>
        <h1 style={{ fontSize: "clamp(2.6rem, 7vw, 5rem)" }}>That didn&apos;t work</h1>
        <p className="lede">Please try again. If it keeps happening, call or message the showroom and we&apos;ll help directly.</p>
        <div className="row" style={{ marginTop: 28 }}>
          <button className="btn" onClick={() => reset()}>Try again</button>
          <button className="btn ghost" onClick={() => window.location.assign("/")}>Home</button>
        </div>
      </div>
    </main>
  );
}
