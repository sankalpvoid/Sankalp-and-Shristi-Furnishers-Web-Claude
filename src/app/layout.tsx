import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./design.css";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const s = getSettings();
  return {
    title: { default: `${s.brand.name} — ${s.brand.tagline}`, template: `%s · ${s.brand.name}` },
    description: s.brand.description,
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  };
}
export const viewport: Viewport = { themeColor: "#fbf8f2", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
