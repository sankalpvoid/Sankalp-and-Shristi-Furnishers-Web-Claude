import { db } from "@/db";
import { DEFAULT_SETTINGS, type SiteSettings } from "./site-defaults";

function merge<T>(base: T, over: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(over) && over.length ? over : base) as T;
  if (base && typeof base === "object" && over && typeof over === "object") {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const k of Object.keys(base as object)) out[k] = merge((base as Record<string, unknown>)[k], (over as Record<string, unknown>)[k]);
    return out as T;
  }
  return (over === undefined || over === null ? base : over) as T;
}

export function getSettings(): SiteSettings {
  const row = db().prepare("SELECT value FROM settings WHERE key='site'").get() as { value: string } | undefined;
  if (!row) return DEFAULT_SETTINGS;
  try { return merge(DEFAULT_SETTINGS, JSON.parse(row.value)); } catch { return DEFAULT_SETTINGS; }
}

export function saveSettings(s: SiteSettings) {
  db().prepare("INSERT INTO settings (key,value,updated_at) VALUES ('site',?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").run(JSON.stringify(s));
}

/** Build a wa.me link, or null if no WhatsApp number has been configured. */
export function whatsappUrl(s: SiteSettings, message: string): string | null {
  const num = s.contact.whatsapp.replace(/\D/g, "");
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
export function telUrl(s: SiteSettings): string | null {
  const num = s.contact.phone.replace(/[^\d+]/g, "");
  return num ? `tel:${num}` : null;
}
