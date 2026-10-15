import type { ReactNode } from "react";
import { shade } from "@/lib/util";

export const VW = 800;
export const VH = 600;
export const FLOOR = 470;

export interface Theme {
  uid: string;
  wood: string;
  fabric: string;
  ft: string; // fabric type: velvet | linen | boucle | leatherette
}

const TONES: Record<string, { wall: string; wall2: string; floor: string; floor2: string; line: string; light: string }> = {
  ivory: { wall: "#f3ede2", wall2: "#e9e0d0", floor: "#d8ccb6", floor2: "#c9bca4", line: "#d2c6b0", light: "#fffaf0" },
  sand: { wall: "#e9dfcc", wall2: "#dccfb7", floor: "#c8b896", floor2: "#b9a883", line: "#c3b392", light: "#f6ecd8" },
  stone: { wall: "#dfdbd2", wall2: "#d0cbc0", floor: "#b9b3a6", floor2: "#a8a193", line: "#b5aea0", light: "#efece5" },
  charcoal: { wall: "#44413d", wall2: "#383532", floor: "#2b2927", floor2: "#232120", line: "#2f2d2a", light: "#5d5851" },
};

/** Room backdrop: wall, soft arched daylight, floor. */
export function Scene({ tone = "ivory", uid, children, arch = true }: { tone?: string; uid: string; children: ReactNode; arch?: boolean }) {
  const t = TONES[tone] ?? TONES.ivory;
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.wall} />
          <stop offset="1" stopColor={t.wall2} />
        </linearGradient>
        <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.floor} />
          <stop offset="1" stopColor={t.floor2} />
        </linearGradient>
        <linearGradient id={`${uid}-light`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.light} stopOpacity="0.85" />
          <stop offset="1" stopColor={t.light} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}-shadow`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.32" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={VW} height={VH} fill={`url(#${uid}-wall)`} />
      {arch && (
        <>
          <path d={`M90 ${FLOOR} V250 A110 110 0 0 1 310 250 V${FLOOR} Z`} fill={`url(#${uid}-light)`} opacity="0.55" />
          <path d={`M90 ${FLOOR} V250 A110 110 0 0 1 310 250 V${FLOOR}`} fill="none" stroke={t.line} strokeWidth="2" opacity="0.7" />
          <path d={`M620 ${FLOOR} L760 ${FLOOR} L690 60 Z`} fill={t.light} opacity="0.12" />
        </>
      )}
      <rect y={FLOOR} width={VW} height={VH - FLOOR} fill={`url(#${uid}-floor)`} />
      <rect y={FLOOR - 1} width={VW} height="3" fill={t.line} />
      {children}
    </>
  );
}

export function GroundShadow({ cx, cy = FLOOR + 6, rx, ry = 14, uid }: { cx: number; cy?: number; rx: number; ry?: number; uid: string }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${uid}-shadow)`} />;
}

/** Shared paint definitions for wood + fabric. */
export function Paint({ t }: { t: Theme }) {
  const u = t.uid;
  return (
    <defs>
      <linearGradient id={`${u}-wood`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={shade(t.wood, 0.1)} />
        <stop offset="1" stopColor={shade(t.wood, -0.16)} />
      </linearGradient>
      <linearGradient id={`${u}-woodv`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={shade(t.wood, 0.06)} />
        <stop offset="0.5" stopColor={shade(t.wood, -0.04)} />
        <stop offset="1" stopColor={shade(t.wood, -0.18)} />
      </linearGradient>
      <pattern id={`${u}-grain`} width="70" height="16" patternUnits="userSpaceOnUse">
        <path d="M0 4 Q17 1 35 4 T70 4 M0 11 Q17 8 35 11 T70 11 M0 14 Q20 12 40 14 T70 14" stroke="#000" strokeOpacity="0.10" strokeWidth="1" fill="none" />
      </pattern>
      <linearGradient id={`${u}-fab`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={shade(t.fabric, 0.08)} />
        <stop offset="1" stopColor={shade(t.fabric, -0.1)} />
      </linearGradient>
      <linearGradient id={`${u}-fabd`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={shade(t.fabric, -0.12)} />
        <stop offset="1" stopColor={shade(t.fabric, -0.3)} />
      </linearGradient>
      <linearGradient id={`${u}-sheen`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.12" />
      </linearGradient>
      <pattern id={`${u}-weave`} width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M0 3H6M3 0V6" stroke="#000" strokeOpacity="0.035" strokeWidth="0.8" />
      </pattern>
      <pattern id={`${u}-bouc`} width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.3" fill="#fff" fillOpacity="0.22" />
        <circle cx="6" cy="6" r="1.3" fill="#000" fillOpacity="0.08" />
      </pattern>
    </defs>
  );
}

type Geo = { x: number; y: number; w: number; h: number; r?: number; rot?: string };

export function WoodRect({ t, x, y, w, h, r = 3, rot, vertical }: Geo & { t: Theme; vertical?: boolean }) {
  return (
    <g transform={rot}>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${t.uid}-${vertical ? "woodv" : "wood"})`} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${t.uid}-grain)`} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke="#000" strokeOpacity="0.15" />
    </g>
  );
}
export function WoodPath({ t, d, vertical }: { t: Theme; d: string; vertical?: boolean }) {
  return (
    <g>
      <path d={d} fill={`url(#${t.uid}-${vertical ? "woodv" : "wood"})`} />
      <path d={d} fill={`url(#${t.uid}-grain)`} />
      <path d={d} fill="none" stroke="#000" strokeOpacity="0.15" />
    </g>
  );
}

export function FabricRect({ t, x, y, w, h, r = 10, dark, rot }: Geo & { t: Theme; dark?: boolean }) {
  return (
    <g transform={rot}>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${t.uid}-${dark ? "fabd" : "fab"})`} />
      {t.ft === "linen" && <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${t.uid}-weave)`} />}
      {t.ft === "boucle" && <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${t.uid}-bouc)`} />}
      {(t.ft === "velvet" || t.ft === "leatherette") && <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${t.uid}-sheen)`} opacity={t.ft === "leatherette" ? 1 : 0.7} />}
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke="#000" strokeOpacity="0.12" />
    </g>
  );
}
export function FabricPath({ t, d, dark }: { t: Theme; d: string; dark?: boolean }) {
  return (
    <g>
      <path d={d} fill={`url(#${t.uid}-${dark ? "fabd" : "fab"})`} />
      {t.ft === "linen" && <path d={d} fill={`url(#${t.uid}-weave)`} />}
      {t.ft === "boucle" && <path d={d} fill={`url(#${t.uid}-bouc)`} />}
      {(t.ft === "velvet" || t.ft === "leatherette") && <path d={d} fill={`url(#${t.uid}-sheen)`} opacity="0.8" />}
      <path d={d} fill="none" stroke="#000" strokeOpacity="0.12" />
    </g>
  );
}
