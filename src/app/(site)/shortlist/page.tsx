import type { Metadata } from "next";
import { ShortlistView } from "@/components/ShortlistView";
export const metadata: Metadata = { title: "Your shortlist" };
export default function ShortlistPage() {
  return (
    <div className="wrap" style={{ paddingBottom: 100 }}>
      <div className="page-head"><span className="eyebrow">Before you visit</span><h1>Your shortlist</h1><p className="lede">The products and saved designs you&apos;d like to see in person.</p></div>
      <ShortlistView />
    </div>
  );
}
