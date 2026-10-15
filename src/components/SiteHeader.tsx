"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { useShortlist } from "@/lib/shortlist";
import type { SiteSettings } from "@/lib/site-defaults";

interface Cat { slug: string; name: string; group_name: string }
const DESIGN = [
  { href: "/design/bed", label: "Bed", sub: "Size, headboard, finish, storage" },
  { href: "/design/sofa", label: "Sofa", sub: "Layout, fabric, legs, cushions" },
  { href: "/design/sofa-cum-bed", label: "Sofa-cum-bed", sub: "Mechanism, fabric, size" },
  { href: "/design/dining", label: "Dining table", sub: "Shape, seats, finish, chairs" },
];

export function SiteHeader({ brand, categories }: { brand: SiteSettings["brand"]; categories: Cat[] }) {
  const path = usePathname();
  const [open, setOpen] = useState<null | "shop" | "design" | "menu">(null);
  const navRef = useRef<HTMLElement>(null);
  const list = useShortlist();
  const groups = categories.reduce<Record<string, Cat[]>>((a, c) => ((a[c.group_name] ||= []).push(c), a), {});

  useEffect(() => { setOpen(null); }, [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onClick = (e: MouseEvent) => {
      if (open && open !== "menu" && navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);
  useEffect(() => {
    document.body.style.overflow = open === "menu" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const cur = (href: string) => (path === href || path.startsWith(href + "/") ? "page" : undefined);

  return (
    <header className="header">
      <div className="wrap">
        <Link href="/" className="brand" aria-label={`${brand.name} — home`}><Logo brand={brand} /></Link>

        <nav className="nav" aria-label="Main" ref={navRef}>
          <div className="dd">
            <button aria-expanded={open === "shop"} aria-controls="dd-shop" onClick={() => setOpen(open === "shop" ? null : "shop")}>Explore Furniture <span aria-hidden>▾</span></button>
            {open === "shop" && (
              <div className="dd-panel" id="dd-shop">
                {Object.entries(groups).map(([g, cs]) => (
                  <div key={g}>
                    <h4>{g}</h4>
                    {cs.map((c) => <Link key={c.slug} href={`/shop/${c.slug}`}>{c.name}</Link>)}
                  </div>
                ))}
                <div><h4>Everything</h4><Link href="/shop">All furniture</Link></div>
              </div>
            )}
          </div>
          <div className="dd">
            <button aria-expanded={open === "design"} aria-controls="dd-design" onClick={() => setOpen(open === "design" ? null : "design")}>Design Your Own <span aria-hidden>▾</span></button>
            {open === "design" && (
              <div className="dd-panel narrow" id="dd-design">
                {DESIGN.map((d) => <Link key={d.href} href={d.href}>{d.label}<small>{d.sub}</small></Link>)}
              </div>
            )}
          </div>
          <Link href="/making" aria-current={cur("/making")}>The Art of Making</Link>
          <Link href="/showroom" aria-current={cur("/showroom")}>Showroom</Link>
          <Link href="/contact" aria-current={cur("/contact")}>Contact</Link>
        </nav>

        <div className="header-actions">
          <Link href="/shortlist" className="icon-btn" aria-label={`Shortlist, ${list.length} saved`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10Z" /></svg>
            {list.length > 0 && <span className="badge-count">{list.length}</span>}
          </Link>
          <Link href="/contact" className="btn sm">Enquire</Link>
          <button className="icon-btn menu-btn" aria-expanded={open === "menu"} aria-controls="mobile-menu" aria-label={open === "menu" ? "Close menu" : "Open menu"} onClick={() => setOpen(open === "menu" ? null : "menu")}>
            <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" fill="none" aria-hidden>
              {open === "menu" ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open === "menu" && (
        <div className="mobile-menu" id="mobile-menu">
          <Link href="/shop">Explore Furniture</Link>
          <div className="sub">{categories.map((c) => <Link key={c.slug} href={`/shop/${c.slug}`}>{c.name}</Link>)}</div>
          <Link href="/design">Design Your Own</Link>
          <div className="sub">{DESIGN.map((d) => <Link key={d.href} href={d.href}>{d.label}</Link>)}</div>
          <Link href="/making">The Art of Making</Link>
          <Link href="/showroom">Showroom</Link>
          <Link href="/shortlist">Shortlist {list.length > 0 && `(${list.length})`}</Link>
          <Link href="/contact">Contact</Link>
        </div>
      )}
    </header>
  );
}
