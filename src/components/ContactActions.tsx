import Link from "next/link";
import type { SiteSettings } from "@/lib/site-defaults";
import { telUrl, whatsappUrl } from "@/lib/settings";

/**
 * Context-aware contact buttons. WhatsApp/phone only render as real links when a
 * number has been configured; otherwise we send people to the enquiry form
 * (never a dead or invented link).
 */
export function ContactActions({ s, message, enquireHref, size, dark, show = ["whatsapp", "call", "enquire"] }: {
  s: SiteSettings; message: string; enquireHref: string; size?: "sm"; dark?: boolean; show?: ("whatsapp" | "call" | "enquire")[];
}) {
  const wa = whatsappUrl(s, message);
  const tel = telUrl(s);
  const cls = `btn ${size ?? ""}`;
  return (
    <div className="row">
      {show.includes("whatsapp") && wa && <a className={`${cls} ghost`} href={wa} target="_blank" rel="noopener noreferrer">WhatsApp us</a>}
      {show.includes("call") && tel && <a className={`${cls} ghost`} href={tel}>Call</a>}
      {show.includes("enquire") && <Link className={`${cls} ${dark ? "gold" : ""}`} href={enquireHref}>Send an enquiry</Link>}
    </div>
  );
}
