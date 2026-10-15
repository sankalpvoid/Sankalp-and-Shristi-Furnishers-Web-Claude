import Link from "next/link";
import { Logo } from "./Logo";
import type { SiteSettings } from "@/lib/site-defaults";
import { PLACEHOLDER } from "@/lib/site-defaults";
import { telUrl, whatsappUrl } from "@/lib/settings";

export function SiteFooter({ s, categories }: { s: SiteSettings; categories: { slug: string; name: string }[] }) {
  const c = s.contact;
  const tel = telUrl(s);
  const wa = whatsappUrl(s, "Hello, I have a question about your furniture.");
  const socials = [["Instagram", c.instagram], ["Facebook", c.facebook], ["YouTube", c.youtube]].filter(([, u]) => u);
  return (
    <footer className="footer dark">
      <div className="wrap">
        <div className="footer-grid">
          <div className="about">
            <Link href="/" className="brand"><Logo brand={s.brand} /></Link>
            <p style={{ marginTop: 20, color: "#bdb4a5", maxWidth: "36ch" }}>{s.brand.description}</p>
            <p style={{ color: "#bdb4a5", maxWidth: "36ch", fontSize: ".88rem" }}>{s.story.sleepwellText.split(".")[0]}.</p>
          </div>
          <div>
            <h4>Furniture</h4>
            <ul>
              {categories.slice(0, 8).map((x) => <li key={x.slug}><Link href={`/shop/${x.slug}`}>{x.name}</Link></li>)}
              <li><Link href="/shop">All furniture</Link></li>
            </ul>
          </div>
          <div>
            <h4>Design your own</h4>
            <ul>
              <li><Link href="/design/bed">Bed</Link></li>
              <li><Link href="/design/sofa">Sofa</Link></li>
              <li><Link href="/design/sofa-cum-bed">Sofa-cum-bed</Link></li>
              <li><Link href="/design/dining">Dining table</Link></li>
              <li><Link href="/making">The Art of Making</Link></li>
              <li><Link href="/shortlist">Your shortlist</Link></li>
            </ul>
          </div>
          <div>
            <h4>Visit &amp; contact</h4>
            <ul>
              <li className={c.address ? "" : "placeholder"} style={{ whiteSpace: "pre-line" }}>{c.address || PLACEHOLDER.address}</li>
              <li className={c.hours ? "" : "placeholder"} style={{ whiteSpace: "pre-line" }}>{c.hours || PLACEHOLDER.hours}</li>
              <li>{tel ? <a href={tel}>{c.phone}</a> : <span className="placeholder">{PLACEHOLDER.phone}</span>}</li>
              <li>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <span className="placeholder">{PLACEHOLDER.email}</span>}</li>
              {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
              <li><Link href="/showroom">Plan your visit</Link></li>
              {socials.map(([n, u]) => <li key={n}><a href={u} target="_blank" rel="noopener noreferrer">{n}</a></li>)}
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} {s.brand.name}</span>
          <span><Link href="/privacy">Privacy</Link> · <Link href="/contact">Contact</Link></span>
        </div>
      </div>
    </footer>
  );
}
