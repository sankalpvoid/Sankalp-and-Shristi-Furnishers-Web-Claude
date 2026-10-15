import Link from "next/link";
import type { Metadata } from "next";
import { Art } from "@/components/art";
import { EnquiryForm } from "@/components/EnquiryForm";
import { ContactActions } from "@/components/ContactActions";
import { getSettings, publicClaims } from "@/lib/settings";
import { getConfiguration, getPublishedProduct, listCategories } from "@/lib/repo";
import { PLACEHOLDER } from "@/lib/site-defaults";
import { RenderPhoto } from "@/components/Photo";
import { siteRender } from "@/lib/renders";

export const metadata: Metadata = { title: "Visit the showroom" };

export default async function Showroom({ searchParams }: { searchParams: Promise<{ product?: string; config?: string }> }) {
  const sp = await searchParams;
  const s = getSettings();
  const claims = publicClaims(s);
  const render = siteRender("showroom");
  const c = s.contact;
  const cats = listCategories().map((x) => ({ slug: x.slug, name: x.name }));
  const product = sp.product ? getPublishedProduct(sp.product) : undefined;
  const cfg = sp.config ? getConfiguration(sp.config) : undefined;
  return (
    <>
      <section className="wrap">
        <div className="page-head" style={{ paddingBottom: 28 }}>
          <span className="eyebrow">The showroom</span>
          <h1 style={{ maxWidth: "12ch" }}>Come and see it in person</h1>
        </div>
        <div className="sr-hero">
          <div>
            <p className="lede">{s.story.showroomIntro}</p>
            {claims.legacy && <p className="callout" style={{ margin: "28px 0" }}>{claims.legacy}</p>}
            <dl className="contact-list">
              <div><dt>Address</dt><dd className={c.address ? "hours" : "placeholder on-light"}>{c.address || PLACEHOLDER.address}</dd></div>
              <div><dt>Hours</dt><dd className={c.hours ? "hours" : "placeholder on-light"}>{c.hours || PLACEHOLDER.hours}</dd></div>
              <div><dt>Phone</dt><dd className={c.phone ? "" : "placeholder on-light"}>{c.phone || PLACEHOLDER.phone}</dd></div>
              <div><dt>Email</dt><dd className={c.email ? "" : "placeholder on-light"}>{c.email || PLACEHOLDER.email}</dd></div>
            </dl>
            <ContactActions s={s} message="Hello, I'd like to visit your showroom. Could you confirm the timings?" enquireHref="/showroom#plan" show={["whatsapp", "call"]} />
          </div>
          <div className="media">
            {render ? <RenderPhoto r={render} alt="A studio render of a sofa set in a sunlit interior (placeholder image)" sizes="(min-width:960px) 58vw, 100vw" priority tag="Studio render · not our showroom" /> : <><Art art={{ kind: "sofa", layout: "seven", wood: "#6e4a2f", fabric: "#b3aa9b", fabric_type: "boucle" }} tone="sand" zoom={1.1} label="Illustration" /><span className="ill-tag">Illustration · showroom photography coming</span></>}
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
