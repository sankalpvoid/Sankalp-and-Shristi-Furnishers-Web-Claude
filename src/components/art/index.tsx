import { useId } from "react";
import type { ArtParams } from "@/lib/types";
import { VH, VW, type Theme } from "./core";
import { Armchair, Bed, CentreTable, Dining, DiningChairSolo, Dressing, Mattress, Sofa, SofaBed, SceneFrame, Stool } from "./pieces";

const DEFAULT_WOOD = "#b98a52";
const DEFAULT_FABRIC = "#b3aa9b";

export interface ArtProps {
  art: ArtParams;
  /** Overrides for live configurator state */
  tone?: string;
  className?: string;
  label?: string;
  open?: boolean; // sofa-cum-bed open state
  /** Crop in on the furniture (1 = whole room). Default 1.2 keeps pieces large in cards. */
  zoom?: number;
}

const FT_KEYS: Record<string, string> = { velvet: "velvet", linen: "linen", boucle: "boucle", leatherette: "leatherette" };

/** Illustrative placeholder artwork. Clearly not a photograph of real stock. */
export function Art({ art, tone, className, label, open, zoom = 1.2 }: ArtProps) {
  const vw = VW / zoom, vh = VH / zoom;
  const vx = (VW - vw) / 2, vy = Math.min(VH - vh, 350 - vh * 0.6);
  const uid = "a" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const t: Theme = {
    uid,
    wood: String(art.wood || DEFAULT_WOOD),
    fabric: String(art.fabric || DEFAULT_FABRIC),
    ft: FT_KEYS[String(art.fabric_type || "")] || "velvet",
  };
  const kind = String(art.kind || "sofa");
  const piece = (() => {
    switch (kind) {
      case "bed": return <Bed t={t} size={String(art.size || "queen")} headboard={String(art.headboard || "panel")} storage={String(art.storage || "none")} custom={Number(art.custom_width) || undefined} />;
      case "divan": return <Bed t={t} size="double" headboard="panel" storage="none" low />;
      case "sofa": return <Sofa t={t} layout={String(art.layout || "three")} legs={String(art.legs || "tapered")} cushions={String(art.cushions || "fixed")} />;
      case "couch": return <Sofa t={t} layout="lshape" legs={String(art.legs || "block")} cushions="loose" />;
      case "sofabed": return <SofaBed t={t} layout={String(art.layout || "three")} sleeper={String(art.sleeper || "single")} open={open ?? false} storage={String(art.storage || "none")} />;
      case "chair": return <Armchair t={t} legs={String(art.legs || "tapered")} />;
      case "dining": return <Dining t={t} shape={String(art.shape || "rectangular")} capacity={Number(art.capacity) || 6} chairs={String(art.chairs || "wood")} />;
      case "diningchair": return <DiningChairSolo t={t} kind={art.fabric ? "upholstered" : "wood"} />;
      case "dressing": return <Dressing t={t} />;
      case "centretable": return <CentreTable t={t} round />;
      case "stool": return <Stool t={t} />;
      case "mattress": return <Mattress t={t} />;
      default: return <Sofa t={t} />;
    }
  })();
  return (
    <svg
      viewBox={`${vx.toFixed(1)} ${vy.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`}
      className={className}
      role="img"
      aria-label={label || "Illustration of furniture"}
      preserveAspectRatio="xMidYMid slice"
    >
      <SceneFrame tone={tone || (art.tone as string) || "ivory"} uid={uid} t={t}>{piece}</SceneFrame>
    </svg>
  );
}
export { SceneFrame };
