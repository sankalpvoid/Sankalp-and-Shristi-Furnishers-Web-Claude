import Link from "next/link";
import type { Metadata } from "next";
import { EnquiryForm } from "@/components/EnquiryForm";
import { ContactActions } from "@/components/ContactActions";
import { getSettings } from "@/lib/settings";
import { getConfiguration, getPublishedProduct } from "@/lib/repo";
import { PLACEHOLDER } from "@/lib/site-defaults";
import { parseJson } from "@/lib/util";
import { summaryText } from "@/lib/configurator";
import type { Intent, SummaryLine } from "@/lib/types";

export const metadata: Metadata = { title: "Contact & enquiries" };
type SP = { product?: string; config?: string; intent?: string; about?: string };

export default async function Contact({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = getSettings();
  const product = sp.product ? getPublishedProduct(sp.product) : undefined;
  const cfg = sp.config ? getConfiguration(sp.config) : undefined;
  const intent = (["exploring", "quote", "visit", "order"].includes(sp.intent ?? "") ? sp.intent : "quote") as Intent;
  const summary = cfg ? summaryText(parseJson<SummaryLine[]>(cfg.summary, [])) : "";
  const about = product?.name ?? (cfg ? "" : sp.about?.slice(0, 60));
  const c = s.contact;
  return (
    <div className="wrap">
      <div className="page-head">
        <span className="eyebrow">Contact</span>
        <h1>Tell us what you&apos;re looking for</h1>
        <p className="lede">Send an enquiry and the team will get back to you. You can also WhatsApp, call or visit the showroom.</p>
      </div>
      <div className="split" style={{ alignItems: "start", paddingBottom: 100 }}>
        <div>
          <EnquiryForm mode="enquiry" productId={product?.id} productName={product?.name} configRef={cfg?.ref} configSummary={summary} defaultIntent={intent}
            defaultMessage={!product && !cfg && about ? `I'd like to know more about: ${about}.` : ""} />
        </div>
        <aside>
          <h3>Other ways to reach us</h3>
          <dl className="kv" style={{ margin: "18px 0 24px", gridTemplateColumns: "6em 1fr" }}>
            <dt>Phone</dt><dd className={c.phone ? "" : "placeholder on-light"}>{c.phone || PLACEHOLDER.phone}</dd>
            <dt>WhatsApp</dt><dd className={c.whatsapp ? "" : "placeholder on-light"}>{c.whatsapp ? `+${c.whatsapp.replace(/\D/g, "")}` : PLACEHOLDER.whatsapp}</dd>
            <dt>Email</dt><dd className={c.email ? "" : "placeholder on-light"}>{c.email || PLACEHOLDER.email}</dd>
            <dt>Showroom</dt><dd className={c.address ? "hours" : "placeholder on-light"}>{c.address || PLACEHOLDER.address}</dd>
          </dl>
          <ContactActions s={s} message={`Hello, I'd like to ask about ${product?.name ?? cfg?.ref ?? "your furniture"}.`} enquireHref="/contact" show={["whatsapp", "call"]} />
          <p style={{ marginTop: 28 }}><Link className="linkarrow" href="/showroom#plan">Plan a showroom visit</Link></p>
        </aside>
      </div>
    </div>
  );
}
