"use client";
import { shortlist, useShortlist, type ShortlistItem } from "@/lib/shortlist";

export function ShortlistButton({ item, className = "btn ghost" }: { item: ShortlistItem; className?: string }) {
  const list = useShortlist();
  const on = list.some((i) => i.key === item.key);
  return (
    <button type="button" className={className} aria-pressed={on} onClick={() => shortlist.toggle(item)}>
      {on ? "✓ In your shortlist" : "Add to shortlist"}
    </button>
  );
}
