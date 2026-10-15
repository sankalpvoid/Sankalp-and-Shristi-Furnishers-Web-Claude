import Link from "next/link";
import type { Metadata } from "next";
import { Art } from "@/components/art";
import { EnquiryForm } from "@/components/EnquiryForm";
import { ContactActions } from "@/components/ContactActions";
import { getSettings, publicClaims } from "@/lib/settings";
import { getConfiguration, getPublishedProduct, listCategories } from "@/lib/repo";
import { PLACEHOLDER } from "@/lib/site-defaults";

export const metadata: Metadata = { title: "Visit the showroom" };

export default async function Showroom({ searchParams }: { searchParams: Promise<{ product?: string; config?: string }> }) {
  const sp = await searchParams;
  const s = getSettings();
  const claims = publicClaims(s);
  const c = s.contact;
  const cats = listCategories().map((x) => ({ slug: x.slug, name: x.name }));
  const product = sp.product ? getPublishedProduct(sp.product) : undefined;
  const cfg = sp.config ? getConfiguration(sp.config) : undefined;
  return (
    <>
      <section className="wrap">
        <div className="page-head">
          <span className="eyebrow">The showroom</span>
          <h1>Come and see it in person</h1>
          <p className="lede">{s.story.showroomIntro}</p>
        </div>
        <div className="split" style={{ paddingBottom: 80 }}>
          <div className="media" style={{ aspectRatio: "4/3.2" }}><Art art={{ kind: "sofa", layout: "seven", wood: "#6e4a2f", fabric: "#b3aa9b", fabric_type: "boucle" }} tone="sand" label="Illustration" /><span className="ill-tag">Illustration · showroom photography coming</span></div>
          <div>
            {claims.legacy && <p className="callout">{claims.legacy}</p>}
            <dl className="kv" style={{ margin: "32px 0", gridTemplateColumns: "7em 1fr", rowGap: 18 }}>
              <dt>Address</dt><dd className={c.address ? "hours" : "placeholder on-light"}>{c.address || PLACEHOLDER.address}</dd>
              <dt>Hours</dt><dd className={c.hours ? "hours" : "placeholder on-light"}>{c.hours || PLACEHOLDER.hours}</dd>
              <dt>Phone</dt><dd className={c.phone ? "" : "placeholder on-light"}>{c.phone || PLACEHOLDER.phone}</dd>
              <dt>Email</dt><dd className={c.email ? "" : "placeholder on-light"}>{c.email || PLACEHOLDER.email}</dd>
            </dl>
            <ContactActions s={s} message="Hello, I'd like to visit your showroom. Could you confirm the timings?" enquireHref="/showroom#plan" show={["whatsapp", "call"]} />
          </div>
        </div>
      </section>

      <section className="section tint">
        <div className="wrap split" style={{ alignItems: "start" }}>
          <div>
            <span className="eyebrow">Getting here</span>
            <h2>Directions</h2>
            {c.mapUrl ? (
              <p><a className="btn" href={c.mapUrl} target="_blank" rel="noopener noreferrer">Open in Maps</a></p>
            ) : (
              <div className="map-ph"><div><b>Map to be added</b><br /><span className="small">The owner can add a Google Maps link in Admin → Brand &amp; contact.</span></div></div>
            )}
            <h3 style={{ marginTop: 40 }}>What to expect</h3>
            <ol className="steps-list"><li>Send a visit request below</li><li>The team confirms a day and time</li><li>See the pieces, fabrics and finishes</li><li>Talk through customisation and pricing</li></ol>
            <p className="small muted">Visit requests are not confirmed appointments. There is no online booking — the team will contact you.</p>
          </div>
          <div id="plan" style={{ scrollMarginTop: 100 }}>
            <h2>Plan your visit</h2>
            <EnquiryForm mode="visit" categories={cats} productId={product?.id} productName={product?.name} configRef={cfg?.ref} />
            <p className="small" style={{ marginTop: 20 }}><Link href="/shortlist">View your shortlist</Link> — saved items are attached to your request if you choose.</p>
          </div>
        </div>
      </section>
    </>
  );
}
