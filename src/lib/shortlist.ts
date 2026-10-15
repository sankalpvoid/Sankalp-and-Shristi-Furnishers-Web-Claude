"use client";
import { useSyncExternalStore } from "react";

export interface ShortlistItem { kind: "product" | "config"; key: string; name: string; href: string }
const KEY = "ssfi.shortlist.v1";
const listeners = new Set<() => void>();
let cache: { raw: string; items: ShortlistItem[] } = { raw: "", items: [] };

function read(): ShortlistItem[] {
  try {
    const raw = localStorage.getItem(KEY) || "[]";
    if (raw !== cache.raw) cache = { raw, items: JSON.parse(raw) };
    return cache.items;
  } catch { return cache.items; }
}
function write(items: ShortlistItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, 30))); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
}
export const shortlist = {
  toggle(item: ShortlistItem) {
    const cur = read();
    write(cur.some((i) => i.key === item.key) ? cur.filter((i) => i.key !== item.key) : [...cur, item]);
  },
  remove(key: string) { write(read().filter((i) => i.key !== key)); },
  clear() { write([]); },
};
const empty: ShortlistItem[] = [];
export function useShortlist(): ShortlistItem[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); window.addEventListener("storage", cb); return () => { listeners.delete(cb); window.removeEventListener("storage", cb); }; },
    read,
    () => empty,
  );
}
