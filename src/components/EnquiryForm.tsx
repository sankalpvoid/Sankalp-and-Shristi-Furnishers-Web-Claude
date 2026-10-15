"use client";
import { useState } from "react";
import Link from "next/link";
import { INTENTS } from "@/lib/constants";
import { useShortlist } from "@/lib/shortlist";
import type { Intent } from "@/lib/types";

interface Props {
  mode: "enquiry" | "visit";
  productId?: number;
  productName?: string;
  configRef?: string;
  configSummary?: string;
  defaultIntent?: Intent;
  showIntent?: boolean;
  categories?: { slug: string; name: string }[];
  defaultMessage?: string;
}

export function EnquiryForm({ mode, productId, productName, configRef: cref, configSummary, defaultIntent = "quote", showIntent = true, categories = [], defaultMessage = "" }: Props) {
  const [intent, setIntent] = useState<Intent>(mode === "visit" ? "visit" : defaultIntent);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [done, setDone] = useState<null | { id: number }>(null);
  const [includeShortlist, setIncludeShortlist] = useState(true);
  const list = useShortlist();
  const info = INTENTS.find((i) => i.value === intent)!;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(""); setFields({});
    const f = new FormData(e.currentTarget);
    const cats = f.getAll("categories").map(String);
    const payload = {
      type: mode === "visit" ? "visit" : cref ? (intent === "order" ? "order_intent" : "configuration") : productId ? "product" : intent === "quote" ? "quote" : "general",
      intent,
      name: String(f.get("name") || ""),
      phone: String(f.get("phone") || ""),
      email: String(f.get("email") || ""),
      contactMethod: String(f.get("contactMethod") || "phone"),
      productId,
      configRef: String(f.get("configRef") || cref || ""),
      message: String(f.get("message") || ""),
      preferredDate: String(f.get("preferredDate") || ""),
      categories: cats,
      shortlist: includeShortlist ? list.map((i) => `${i.kind === "config" ? "Configuration" : "Product"}: ${i.name} (${i.key})`) : [],
      website: String(f.get("website") || ""),
    };
    try {
      const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) { setErr(data?.error || "We couldn't send that. Please try again."); setFields(data?.fields || {}); }
      else setDone({ id: data.id });
    } catch { setErr("Network problem — your message was NOT sent. Please check your connection and try again."); }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="notice ok" role="status">
        <h3 style={{ marginBottom: 8 }}>{mode === "visit" ? "Visit request received" : "Enquiry received"}</h3>
        <p>
          Thank you. Your {mode === "visit" ? "visit request" : "enquiry"} has been recorded{done.id ? ` (reference ENQ-${String(done.id).padStart(4, "0")})` : ""}.
          {mode === "visit" ? " This is a request, not a confirmed appointment — the team will contact you to confirm a time." : " The team will contact you using the details you gave. No order has been placed and no payment has been taken."}
        </p>
        <p className="small" style={{ marginBottom: 0 }}><Link href="/shop">Keep browsing</Link> · <Link href="/design">Design something</Link></p>
      </div>
    );
  }

  const fe = (k: string) => (fields[k] ? <span className="err" id={`e-${k}`}>{fields[k]}</span> : null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form className="form" onSubmit={submit} noValidate>
      {err && <div className="notice bad" role="alert">{err}</div>}
      {(productName || cref) && (
        <div className="notice">
          {productName && <div><b>About:</b> {productName}</div>}
          {cref && <div><b>Saved design:</b> <code>{cref}</code>{configSummary ? ` — ${configSummary}` : ""}</div>}
        </div>
      )}
      {mode === "enquiry" && showIntent && (
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend>What would you like to do?</legend>
          <div className="intent-grid">
            {INTENTS.map((i) => (
              <label key={i.value} className="intent">
                <input type="radio" name="intent" value={i.value} checked={intent === i.value} onChange={() => setIntent(i.value)} />
                <b>{i.label}</b>
              </label>
            ))}
          </div>
          <span className="hint">{info.hint}</span>
        </fieldset>
      )}
      <div className="form-row two">
        <div className="field"><label htmlFor="name">Your name</label><input className="input" id="name" name="name" autoComplete="name" required aria-describedby="e-name" />{fe("name")}</div>
        <div className="field"><label htmlFor="phone">Phone number</label><input className="input" id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required aria-describedby="e-phone" />{fe("phone")}</div>
      </div>
      <div className="form-row two">
        <div className="field"><label htmlFor="email">Email <span className="muted">(optional)</span></label><input className="input" id="email" name="email" type="email" autoComplete="email" aria-describedby="e-email" />{fe("email")}</div>
        <div className="field"><label htmlFor="cm">Best way to reach you</label>
          <select className="select" id="cm" name="contactMethod" defaultValue="phone"><option value="phone">Phone call</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select>
        </div>
      </div>
      {mode === "visit" && (
        <>
          <div className="field"><label htmlFor="date">Preferred visit date</label><input className="input" id="date" name="preferredDate" type="date" min={today} required aria-describedby="e-preferredDate" />{fe("preferredDate")}<span className="hint">The team will confirm the day and time with you.</span></div>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend>Furniture you&apos;d like to see</legend>
            <div className="checks">{categories.map((c) => <label key={c.slug} className="check"><input type="checkbox" name="categories" value={c.name} /><span>{c.name}</span></label>)}</div>
          </fieldset>
        </>
      )}
      {!cref && mode === "enquiry" && (
        <div className="field"><label htmlFor="cref">Saved design reference <span className="muted">(optional)</span></label><input className="input" id="cref" name="configRef" placeholder="e.g. SSFI-BED-AB12CD" aria-describedby="e-configRef" />{fe("configRef")}</div>
      )}
      <div className="field"><label htmlFor="message">{mode === "visit" ? "Anything we should know?" : "Your message"} <span className="muted">(optional)</span></label><textarea className="textarea" id="message" name="message" defaultValue={defaultMessage} /></div>
      {list.length > 0 && (
        <label className="small" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <input type="checkbox" checked={includeShortlist} onChange={(e) => setIncludeShortlist(e.target.checked)} style={{ marginTop: 5 }} />
          <span>Include my shortlist ({list.length} saved {list.length === 1 ? "item" : "items"}) so the team can have them ready.</span>
        </label>
      )}
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Sending…" : mode === "visit" ? "Request a visit" : info.cta === "Save my design" ? "Send enquiry" : info.cta}</button>
        <p className="small muted" style={{ marginTop: 14 }}>
          Submitting sends this form to the showroom team, who will contact you. We only use your details to respond to this request. See our <Link href="/privacy">privacy note</Link>.
        </p>
      </div>
    </form>
  );
}
