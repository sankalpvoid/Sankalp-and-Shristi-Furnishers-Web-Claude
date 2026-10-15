import { FabricPath, FabricRect, FLOOR, GroundShadow, Paint, Scene, WoodPath, WoodRect, type Theme } from "./core";
import { shade } from "@/lib/util";

/* ------------------------------------------------------------------ BED */
export interface BedProps { size?: string; headboard?: string; storage?: string; custom?: number; low?: boolean }
const BED_W: Record<string, number> = { single: 290, double: 390, queen: 440, king: 490 };

export function Bed({ t, size = "queen", headboard = "panel", storage = "none", custom, low }: BedProps & { t: Theme }) {
  const w = size === "custom" ? Math.max(260, Math.min(520, Math.round((custom ?? 60) * 7.2))) : BED_W[size] ?? 440;
  const cx = 400, x0 = cx - w / 2;
  const hasStore = storage === "drawers" || storage === "lift";
  const baseH = low ? 62 : hasStore ? 64 : 44;
  const baseTop = FLOOR - 20 - baseH + 6; // sits on short feet
  const hbTop = low ? baseTop - 70 : headboard === "arched" ? baseTop - 190 : baseTop - 170;
  const pillows = size === "single" ? 1 : 2;
  const mattTop = baseTop - 52;
  const drawers = storage === "drawers";
  return (
    <g>
      <GroundShadow cx={cx} rx={w / 2 + 40} uid={t.uid} />
      {/* headboard */}
      {headboard === "panel" && (
        <g>
          <WoodRect t={t} x={x0 - 8} y={hbTop} w={w + 16} h={baseTop - hbTop + 10} r={6} vertical />
          {!low && <rect x={x0 + 14} y={hbTop + 16} width={w - 28} height={baseTop - hbTop - 40} rx="4" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="2" />}
        </g>
      )}
      {headboard === "slatted" && (
        <g>
          <rect x={x0 - 8} y={hbTop} width={w + 16} height={baseTop - hbTop + 10} rx="5" fill="#241a14" opacity="0.6" />
          {Array.from({ length: Math.floor((w + 8) / 24) }).map((_, i, a) => {
            const gap = (w + 4) / a.length;
            return <WoodRect key={i} t={t} x={x0 - 4 + i * gap + 3} y={hbTop + 6} w={gap - 8} h={baseTop - hbTop + 2} r={3} vertical />;
          })}
          <WoodRect t={t} x={x0 - 8} y={hbTop - 6} w={w + 16} h={16} r={5} />
        </g>
      )}
      {headboard === "arched" && (
        <WoodPath t={t} vertical d={`M${x0 - 8} ${baseTop + 10} V${hbTop + 80} A${(w + 16) / 2} 80 0 0 1 ${x0 + w + 8} ${hbTop + 80} V${baseTop + 10} Z`} />
      )}
      {headboard === "upholstered" && (
        <g>
          <FabricRect t={t} x={x0 - 6} y={hbTop} w={w + 12} h={baseTop - hbTop + 10} r={14} dark />
          {Array.from({ length: Math.floor(w / 46) }).map((_, i, a) => {
            const gx = x0 + ((i + 0.5) * w) / a.length;
            return (
              <g key={i}>
                <line x1={gx + w / a.length / 2} y1={hbTop + 12} x2={gx + w / a.length / 2} y2={baseTop - 4} stroke="#000" strokeOpacity="0.12" strokeWidth="2" opacity={i === a.length - 1 ? 0 : 1} />
                {[0.28, 0.55, 0.8].map((f, j) => <circle key={j} cx={gx} cy={hbTop + (baseTop - hbTop) * f} r="3" fill="#000" fillOpacity="0.28" />)}
              </g>
            );
          })}
          <WoodRect t={t} x={x0 - 6} y={baseTop - 4} w={w + 12} h={14} r={3} />
        </g>
      )}
      {/* pillows */}
      {Array.from({ length: pillows }).map((_, i) => {
        const pw = pillows === 1 ? 130 : (w - 70) / 2;
        const px = pillows === 1 ? cx - pw / 2 : x0 + 28 + i * (pw + 14);
        return (
          <g key={i}>
            <rect x={px} y={mattTop - 36} width={pw} height={50} rx="22" fill="#f2ece0" />
            <rect x={px} y={mattTop - 36} width={pw} height={50} rx="22" fill="none" stroke="#000" strokeOpacity="0.13" />
            <path d={`M${px + 14} ${mattTop - 22} Q${px + pw / 2} ${mattTop - 14} ${px + pw - 14} ${mattTop - 22}`} stroke="#000" strokeOpacity="0.08" fill="none" strokeWidth="2" />
          </g>
        );
      })}
      {/* mattress + bedding */}
      <rect x={x0 + 4} y={mattTop} width={w - 8} height={baseTop - mattTop + 8} rx="10" fill="#efe8da" stroke="#000" strokeOpacity="0.12" />
      <rect x={x0 + 4} y={mattTop + 14} width={w - 8} height={baseTop - mattTop - 6} rx="8" fill="#ddd3c1" />
      <rect x={x0 + 4} y={mattTop + 14} width={w - 8} height="7" fill="#000" fillOpacity="0.06" />
      <path d={`M${x0 + 4} ${mattTop + 38} H${x0 + w - 4}`} stroke="#000" strokeOpacity="0.07" strokeWidth="2" />
      {/* base frame */}
      <WoodRect t={t} x={x0} y={baseTop} w={w} h={baseH} r={4} />
      {drawers && (
        <g>
          {[0, 1].map((i) => {
            const dw = (w - 36) / 2;
            const dx = x0 + 12 + i * (dw + 12);
            return (
              <g key={i}>
                <rect x={dx} y={baseTop + 8} width={dw} height={baseH - 16} rx="3" fill="#000" fillOpacity="0.12" stroke="#000" strokeOpacity="0.28" />
                <rect x={dx + dw / 2 - 18} y={baseTop + baseH / 2 - 2} width="36" height="5" rx="2.5" fill="#d9bd7a" />
              </g>
            );
          })}
        </g>
      )}
      {storage === "lift" && (
        <g>
          <line x1={x0 + 10} y1={baseTop + 12} x2={x0 + w - 10} y2={baseTop + 12} stroke="#000" strokeOpacity="0.3" strokeWidth="2" />
          <rect x={cx - 22} y={baseTop + baseH - 18} width="44" height="5" rx="2.5" fill="#d9bd7a" />
        </g>
      )}
      {/* feet */}
      <WoodRect t={t} x={x0 + 10} y={baseTop + baseH} w={22} h={FLOOR - baseTop - baseH + 6} r={2} vertical />
      <WoodRect t={t} x={x0 + w - 32} y={baseTop + baseH} w={22} h={FLOOR - baseTop - baseH + 6} r={2} vertical />
    </g>
  );
}

/* ----------------------------------------------------------------- SOFA */
export interface SofaProps { layout?: string; legs?: string; cushions?: string }

function Legs({ t, w, legs, y, h }: { t: Theme; w: number; legs: string; y: number; h: number }) {
  const xs = [-w / 2 + 16, w / 2 - 16];
  if (w > 300) xs.splice(1, 0, 0);
  return (
    <g>
      {xs.map((x, i) =>
        legs === "metal" ? (
          <g key={i}><rect x={x - 2.5} y={y} width="5" height={h} fill="#b79a5b" /><rect x={x - 2.5} y={y} width="2" height={h} fill="#fff" fillOpacity="0.4" /></g>
        ) : legs === "block" ? (
          <WoodRect key={i} t={t} x={x - 9} y={y} w={18} h={h} r={2} vertical />
        ) : (
          <WoodPath key={i} t={t} vertical d={`M${x - 8} ${y} H${x + 8} L${x + 4} ${y + h} H${x - 4} Z`} />
        ),
      )}
    </g>
  );
}

function SofaModule({ t, seats, legs, cushions, noBack, leftArm = true, rightArm = true, scale = 1 }: { t: Theme; seats: number; legs: string; cushions: string; noBack?: boolean; leftArm?: boolean; rightArm?: boolean; scale?: number }) {
  const sw = 88, aw = 34;
  const w = seats * sw + (leftArm ? aw : 6) + (rightArm ? aw : 6);
  const legH = legs === "metal" ? 30 : 24;
  const baseH = 44;
  const baseTop = -legH - baseH;
  const backH = noBack ? 0 : 100;
  const innerL = -w / 2 + (leftArm ? aw : 6);
  const innerW = seats * sw;
  return (
    <g transform={`scale(${scale})`}>
      <Legs t={t} w={w} legs={legs} y={-legH} h={legH + 2} />
      {!noBack && <FabricRect t={t} x={innerL - 4} y={baseTop - backH - 6} w={innerW + 8} h={backH + 24} r={18} />}
      {!noBack && cushions === "loose" &&
        Array.from({ length: seats }).map((_, i) => (
          <FabricRect key={i} t={t} x={innerL + i * sw + 4} y={baseTop - backH + 4} w={sw - 8} h={78} r={16} rot={`rotate(${i % 2 ? 3 : -3} ${innerL + i * sw + sw / 2} ${baseTop - 30})`} dark={false} />
        ))}
      {!noBack && cushions === "tufted" &&
        Array.from({ length: seats * 2 }).flatMap((_, i) =>
          [0.3, 0.62].map((f, j) => <circle key={`${i}-${j}`} cx={innerL + 22 + i * (sw / 2)} cy={baseTop - backH + 14 + backH * f} r="2.6" fill="#000" fillOpacity="0.3" />),
        )}
      <FabricRect t={t} x={-w / 2} y={baseTop} w={w} h={baseH} r={8} dark />
      {Array.from({ length: seats }).map((_, i) => (
        <FabricRect key={i} t={t} x={innerL + i * sw + 2} y={baseTop - 30} w={sw - 4} h={38} r={10} />
      ))}
      {leftArm && <FabricRect t={t} x={-w / 2} y={baseTop - 62} w={aw} h={baseH + 62} r={14} />}
      {rightArm && <FabricRect t={t} x={w / 2 - aw} y={baseTop - 62} w={aw} h={baseH + 62} r={14} />}
    </g>
  );
}

function moduleWidth(seats: number, leftArm = true, rightArm = true) { return seats * 88 + (leftArm ? 34 : 6) + (rightArm ? 34 : 6); }

export function Sofa({ t, layout = "three", legs = "tapered", cushions = "fixed" }: SofaProps & { t: Theme }) {
  let parts: { seats: number; noBack?: boolean; la?: boolean; ra?: boolean }[];
  switch (layout) {
    case "one": parts = [{ seats: 1 }]; break;
    case "two": parts = [{ seats: 2 }]; break;
    case "five": parts = [{ seats: 1 }, { seats: 3 }, { seats: 1 }]; break;
    case "seven": parts = [{ seats: 1 }, { seats: 3 }, { seats: 2 }, { seats: 1 }]; break;
    case "lshape": parts = [{ seats: 3, ra: false }, { seats: 1, noBack: true, la: false }]; break;
    default: parts = [{ seats: 3 }];
  }
  const gap = layout === "lshape" ? 0 : 22;
  const widths = parts.map((p) => moduleWidth(p.seats, p.la ?? true, p.ra ?? true));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  const scale = Math.min(1.3, 600 / total);
  let x = 400 - (total * scale) / 2;
  const base = FLOOR + 14;
  return (
    <g>
      <GroundShadow cx={400} rx={(total * scale) / 2 + 30} uid={t.uid} />
      {parts.map((p, i) => {
        const w = widths[i] * scale;
        const cx = x + w / 2;
        x += w + gap * scale;
        return (
          <g key={i} transform={`translate(${cx} ${base})`}>
            <SofaModule t={t} seats={p.seats} legs={legs} cushions={cushions} noBack={p.noBack} leftArm={p.la ?? true} rightArm={p.ra ?? true} scale={scale} />
          </g>
        );
      })}
    </g>
  );
}

/** Armchair / accent chair: a one-seat module, enlarged. */
export function Armchair({ t, legs = "tapered" }: { t: Theme; legs?: string }) {
  return (
    <g>
      <GroundShadow cx={400} rx={170} uid={t.uid} />
      <g transform={`translate(400 ${FLOOR + 16})`}>
        <SofaModule t={t} seats={1} legs={legs} cushions="fixed" scale={2.3} />
      </g>
    </g>
  );
}

/** Sofa-cum-bed. Closed: front-view sofa. Open: oblique flat bed. */
export function SofaBed({ t, layout = "three", sleeper = "single", open, storage = "none" }: { t: Theme; layout?: string; sleeper?: string; open?: boolean; storage?: string }) {
  if (!open) return <Sofa t={t} layout={layout} legs="block" cushions="fixed" />;
  const bw = sleeper === "double" ? 460 : 340;
  const cx = 400;
  const yb = 372, yf = 440;
  const bk = bw * 0.82;
  return (
    <g>
      <GroundShadow cx={cx} rx={bw / 2 + 80} ry={18} uid={t.uid} />
      {/* back rest folded flat becomes the headrest */}
      <FabricPath t={t} dark d={`M${cx - bk / 2} ${yb - 30} H${cx + bk / 2} L${cx + bk / 2 + 8} ${yb} H${cx - bk / 2 - 8} Z`} />
      {/* sleeping surface */}
      <FabricPath t={t} d={`M${cx - bk / 2 - 8} ${yb} H${cx + bk / 2 + 8} L${cx + bw / 2 + 24} ${yf} H${cx - bw / 2 - 24} Z`} />
      <path d={`M${cx - bk / 2 - 8} ${yb} H${cx + bk / 2 + 8} L${cx + bw / 2 + 24} ${yf} H${cx - bw / 2 - 24} Z`} fill="#fff" fillOpacity="0.1" />
      <path d={`M${cx - bw / 2 - 16} ${yb + 38} Q${cx} ${yb + 46} ${cx + bw / 2 + 16} ${yb + 38}`} stroke="#000" strokeOpacity="0.12" fill="none" strokeWidth="2" />
      {/* front edge */}
      <FabricRect t={t} dark x={cx - bw / 2 - 24} y={yf} w={bw + 48} h={30} r={6} />
      {storage === "under" && <rect x={cx - 40} y={yf + 12} width="80" height="4" rx="2" fill="#d9bd7a" />}
      {/* arms */}
      <FabricRect t={t} x={cx - bw / 2 - 46} y={yb - 34} w={34} h={108} r={14} />
      <FabricRect t={t} x={cx + bw / 2 + 12} y={yb - 34} w={34} h={108} r={14} />
      {/* feet */}
      <WoodRect t={t} x={cx - bw / 2 - 30} y={yf + 30} w={18} h={FLOOR - yf - 20} r={2} vertical />
      <WoodRect t={t} x={cx + bw / 2 + 12} y={yf + 30} w={18} h={FLOOR - yf - 20} r={2} vertical />
    </g>
  );
}

/* --------------------------------------------------------------- DINING */
function Chair({ t, x, y, s = 1, kind, front }: { t: Theme; x: number; y: number; s?: number; kind: "wood" | "upholstered"; front?: boolean }) {
  // (x,y) = centre of seat front edge on the floor plane
  const bw = 52 * s, bh = 66 * s;
  if (front) {
    return (
      <g>
        <WoodRect t={t} x={x - bw / 2 + 2} y={y + 12 * s} w={5 * s} h={42 * s} r={1} vertical />
        <WoodRect t={t} x={x + bw / 2 - 7 * s} y={y + 12 * s} w={5 * s} h={42 * s} r={1} vertical />
        <WoodRect t={t} x={x - bw / 2} y={y - 2 * s} w={bw} h={14 * s} r={3} />
        {kind === "upholstered" ? <FabricRect t={t} x={x - bw / 2 + 3} y={y - bh * 0.75} w={bw - 6} h={bh * 0.78} r={8 * s} /> : (
          <>
            <WoodRect t={t} x={x - bw / 2 + 3} y={y - bh * 0.75} w={bw - 6} h={bh * 0.78} r={5 * s} vertical />
            <rect x={x - bw / 2 + 11 * s} y={y - bh * 0.62} width={bw - 22 * s} height={bh * 0.5} rx={3 * s} fill="#000" fillOpacity="0.14" />
          </>
        )}
      </g>
    );
  }
  return (
    <g>
      <WoodRect t={t} x={x - bw / 2 + 2} y={y - 24 * s} w={5 * s} h={50 * s} r={1} vertical />
      <WoodRect t={t} x={x + bw / 2 - 7 * s} y={y - 24 * s} w={5 * s} h={50 * s} r={1} vertical />
      {kind === "upholstered" ? <FabricRect t={t} x={x - bw / 2} y={y - bh - 4 * s} w={bw} h={bh * 0.78} r={8 * s} /> : (
        <>
          <WoodRect t={t} x={x - bw / 2} y={y - bh - 4 * s} w={bw} h={bh * 0.78} r={5 * s} vertical />
          <rect x={x - bw / 2 + 9 * s} y={y - bh + 6 * s} width={bw - 18 * s} height={bh * 0.5} rx={3 * s} fill="#000" fillOpacity="0.16" />
        </>
      )}
    </g>
  );
}

export function DiningChairSolo({ t, kind = "wood" }: { t: Theme; kind?: "wood" | "upholstered" }) {
  return (
    <g>
      <GroundShadow cx={400} rx={120} uid={t.uid} />
      <g transform="translate(0 0)">
        <WoodRect t={t} x={322} y={FLOOR - 190} w={14} h={206} r={3} vertical />
        <WoodRect t={t} x={464} y={FLOOR - 190} w={14} h={206} r={3} vertical />
        {kind === "upholstered" ? <FabricRect t={t} x={330} y={FLOOR - 210} w={140} h={120} r={14} /> : (
          <>
            <WoodRect t={t} x={326} y={FLOOR - 210} w={148} h={110} r={8} vertical />
            {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={344 + i * 26} y={FLOOR - 196} width="14" height="82" rx="3" fill="#000" fillOpacity="0.16" />)}
          </>
        )}
        <WoodRect t={t} x={318} y={FLOOR - 92} w={164} h={28} r={6} />
        <WoodRect t={t} x={324} y={FLOOR - 64} w={14} h={78} r={2} vertical />
        <WoodRect t={t} x={462} y={FLOOR - 64} w={14} h={78} r={2} vertical />
      </g>
    </g>
  );
}

export interface DiningProps { shape?: string; capacity?: number; chairs?: string; chairFabric?: string }
export function Dining({ t, shape = "rectangular", capacity = 6, chairs = "wood", chairKind }: DiningProps & { t: Theme; chairKind?: "wood" | "upholstered" }) {
  const cx = 400;
  const kind = chairKind ?? (chairs === "upholstered" ? "upholstered" : "wood");
  const showChairs = chairs !== "none";
  const per = Math.max(1, Math.floor(capacity / 2));
  const topY = 338; // vertical centre of table top
  let top: React.ReactElement, legs: React.ReactElement, backXs: number[], frontXs: number[];
  let backY: number, frontY: number, backS = 0.95, frontS = 1.18;
  if (shape === "round" || shape === "oval") {
    const rx = shape === "round" ? (capacity >= 6 ? 190 : 150) : capacity >= 8 ? 290 : capacity >= 6 ? 245 : 200;
    const ry = shape === "round" ? rx * 0.3 : rx * 0.25;
    top = (
      <g>
        <ellipse cx={cx} cy={topY + 12} rx={rx} ry={ry} fill="#000" fillOpacity="0.25" />
        <ellipse cx={cx} cy={topY + 8} rx={rx} ry={ry} fill={`url(#${t.uid}-woodv)`} />
        <ellipse cx={cx} cy={topY} rx={rx} ry={ry} fill={`url(#${t.uid}-wood)`} />
        <ellipse cx={cx} cy={topY} rx={rx} ry={ry} fill={`url(#${t.uid}-grain)`} />
        <ellipse cx={cx} cy={topY} rx={rx} ry={ry} fill="none" stroke="#000" strokeOpacity="0.15" />
      </g>
    );
    legs = shape === "round" ? (
      <g>
        <WoodPath t={t} vertical d={`M${cx - 26} ${topY + 12} H${cx + 26} L${cx + 40} ${FLOOR + 2} H${cx - 40} Z`} />
        <ellipse cx={cx} cy={FLOOR + 4} rx="82" ry="12" fill={`url(#${t.uid}-woodv)`} />
      </g>
    ) : (
      <g>
        <WoodRect t={t} x={cx - rx * 0.62} y={topY + 10} w={16} h={FLOOR - topY - 4} r={2} vertical />
        <WoodRect t={t} x={cx + rx * 0.62 - 16} y={topY + 10} w={16} h={FLOOR - topY - 4} r={2} vertical />
      </g>
    );
    const spread = (n: number) => Array.from({ length: n }).map((_, i) => cx + (n === 1 ? 0 : (-0.62 + (1.24 * i) / (n - 1)) * rx));
    backXs = spread(per); frontXs = spread(per);
    backY = topY - ry * 0.5; frontY = topY + ry + 40;
  } else {
    const fw = shape === "square" ? 300 : capacity >= 8 ? 640 : capacity >= 6 ? 520 : 400;
    const bw = fw * 0.86;
    const yb = 300, yf = shape === "square" ? 392 : 372;
    const th = 16;
    top = (
      <g>
        <path d={`M${cx - bw / 2} ${yb} H${cx + bw / 2} L${cx + fw / 2} ${yf} H${cx - fw / 2} Z`} fill={`url(#${t.uid}-wood)`} />
        <path d={`M${cx - bw / 2} ${yb} H${cx + bw / 2} L${cx + fw / 2} ${yf} H${cx - fw / 2} Z`} fill={`url(#${t.uid}-grain)`} />
        <path d={`M${cx - bw / 2} ${yb} H${cx + bw / 2} L${cx + fw / 2} ${yf} H${cx - fw / 2} Z`} fill="none" stroke="#000" strokeOpacity="0.15" />
        <rect x={cx - fw / 2} y={yf} width={fw} height={th} rx="3" fill={`url(#${t.uid}-woodv)`} stroke="#000" strokeOpacity="0.18" />
      </g>
    );
    legs = (
      <g>
        <WoodRect t={t} x={cx - bw / 2 + 12} y={yb + 2} w={13} h={FLOOR - yb - 34} r={2} vertical />
        <WoodRect t={t} x={cx + bw / 2 - 25} y={yb + 2} w={13} h={FLOOR - yb - 34} r={2} vertical />
        <WoodRect t={t} x={cx - fw / 2 + 6} y={yf + th} w={16} h={FLOOR - yf - th + 6} r={2} vertical />
        <WoodRect t={t} x={cx + fw / 2 - 22} y={yf + th} w={16} h={FLOOR - yf - th + 6} r={2} vertical />
      </g>
    );
    const spreadW = (n: number, w: number) => Array.from({ length: n }).map((_, i) => cx + ((i + 0.5) / n - 0.5) * w * 0.9);
    backXs = spreadW(per, bw); frontXs = spreadW(per, fw);
    backY = yb + 6; frontY = yf + th + 34;
  }
  return (
    <g>
      <GroundShadow cx={cx} rx={300} ry={20} uid={t.uid} />
      {showChairs && backXs.map((x, i) => <Chair key={`b${i}`} t={t} x={x} y={backY + 20} s={backS} kind={kind} />)}
      {legs}
      {top}
      {showChairs && frontXs.map((x, i) => <Chair key={`f${i}`} t={t} x={x} y={frontY} s={frontS} kind={kind} front />)}
    </g>
  );
}

/* ---------------------------------------------------------------- OTHER */
export function Dressing({ t }: { t: Theme }) {
  return (
    <g>
      <GroundShadow cx={400} rx={230} uid={t.uid} />
      <rect x={316} y={92} width={168} height={206} rx="84" fill={shade(t.wood, -0.1)} />
      <rect x={326} y={102} width={148} height={186} rx="74" fill="#dfe5e3" />
      <path d="M350 150 Q372 120 410 118" stroke="#fff" strokeOpacity="0.7" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M345 200 L440 130" stroke="#fff" strokeOpacity="0.25" strokeWidth="18" />
      <WoodRect t={t} x={248} y={318} w={304} h={20} r={4} />
      <WoodRect t={t} x={262} y={338} w={276} h={92} r={4} />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={272 + i * 135} y={348} width={120} height={72} rx="3" fill="#000" fillOpacity="0.1" stroke="#000" strokeOpacity="0.25" />
          <rect x={314 + i * 135} y={378} width="36" height="5" rx="2.5" fill="#d9bd7a" />
        </g>
      ))}
      <WoodRect t={t} x={262} y={430} w={16} h={FLOOR - 430 + 8} r={2} vertical />
      <WoodRect t={t} x={522} y={430} w={16} h={FLOOR - 430 + 8} r={2} vertical />
    </g>
  );
}

export function CentreTable({ t, round = true }: { t: Theme; round?: boolean }) {
  return (
    <g>
      <GroundShadow cx={400} rx={230} uid={t.uid} />
      {round ? (
        <g>
          <WoodRect t={t} x={310} y={388} w={14} h={FLOOR - 380} r={2} vertical rot="rotate(8 317 388)" />
          <WoodRect t={t} x={476} y={388} w={14} h={FLOOR - 380} r={2} vertical rot="rotate(-8 483 388)" />
          <ellipse cx="400" cy="404" rx="210" ry="48" fill="#000" fillOpacity="0.22" />
          <ellipse cx="400" cy="396" rx="210" ry="48" fill={`url(#${t.uid}-woodv)`} />
          <ellipse cx="400" cy="386" rx="210" ry="48" fill={`url(#${t.uid}-wood)`} />
          <ellipse cx="400" cy="386" rx="210" ry="48" fill={`url(#${t.uid}-grain)`} />
          <ellipse cx="400" cy="386" rx="210" ry="48" fill="none" stroke="#000" strokeOpacity="0.15" />
        </g>
      ) : null}
    </g>
  );
}

export function Stool({ t }: { t: Theme }) {
  return (
    <g>
      <GroundShadow cx={400} rx={150} uid={t.uid} />
      <WoodRect t={t} x={318} y={330} w={14} h={150} r={2} vertical rot="rotate(7 325 330)" />
      <WoodRect t={t} x={468} y={330} w={14} h={150} r={2} vertical rot="rotate(-7 475 330)" />
      <WoodRect t={t} x={372} y={340} w={14} h={140} r={2} vertical />
      <ellipse cx="400" cy="338" rx="108" ry="26" fill={`url(#${t.uid}-woodv)`} />
      <ellipse cx="400" cy="328" rx="108" ry="26" fill={`url(#${t.uid}-wood)`} />
      <ellipse cx="400" cy="328" rx="108" ry="26" fill={`url(#${t.uid}-grain)`} />
      <ellipse cx="400" cy="328" rx="108" ry="26" fill="none" stroke="#000" strokeOpacity="0.15" />
    </g>
  );
}

export function Mattress({ t }: { t: Theme }) {
  const cx = 400;
  return (
    <g>
      <GroundShadow cx={cx} cy={FLOOR + 4} rx={300} ry={22} uid={t.uid} />
      {/* layers */}
      <path d="M170 410 H630 L676 452 H124 Z" fill="#e9e1d1" stroke="#000" strokeOpacity="0.15" />
      <path d="M170 388 H630 L676 430 H124 Z" fill="#f4eee2" stroke="#000" strokeOpacity="0.12" transform="translate(0 -4)" />
      <rect x="124" y="430" width="552" height="30" rx="6" fill="#f1ebdd" stroke="#000" strokeOpacity="0.14" />
      <rect x="124" y="442" width="552" height="8" fill="#3f3d3a" fillOpacity="0.85" />
      <path d="M124 430 H676" stroke="#000" strokeOpacity="0.12" />
      {/* quilting */}
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} d={`M${200 + i * 56} 386 L${160 + i * 66} 428`} stroke="#000" strokeOpacity="0.08" strokeWidth="2" />
      ))}
      {[0, 1, 2].map((i) => <path key={i} d={`M${158 - i * 4 + 6} ${398 + i * 14} H${642 + i * 4 - 6}`} stroke="#000" strokeOpacity="0.07" strokeWidth="2" />)}
    </g>
  );
}

export function SceneFrame({ tone, uid, t, children, arch }: { tone?: string; uid: string; t: Theme; children: React.ReactNode; arch?: boolean }) {
  return (
    <>
      <Paint t={t} />
      <Scene tone={tone} uid={uid} arch={arch}>{children}</Scene>
    </>
  );
}
