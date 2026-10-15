"use client";
import { useState } from "react";
import { Art } from "./art";
import type { PublicProduct } from "@/lib/types";
import { RenderPhoto } from "./Photo";
import type { RenderImg } from "@/lib/renders";

export function Gallery({ p, render }: { p: PublicProduct; render?: RenderImg | null }) {
  const [i, setI] = useState(0);
  const img = p.images[i];
  return (
    <div>
      <div className="media pdp-main">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.url} alt={img.alt || p.name} />
        ) : render ? (
          <RenderPhoto r={render} alt={`Studio render of ${p.name} (placeholder image)`} sizes="(min-width:960px) 60vw, 100vw" priority />
        ) : (
          <>
            <Art art={p.art} label={`Illustration of ${p.name}`} />
            <span className="ill-tag">Illustration — photographs coming soon</span>
          </>
        )}
      </div>
      {p.images.length > 1 && (
        <div className="thumbs">
          {p.images.map((m, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <button key={k} aria-pressed={k === i} aria-label={`Show image ${k + 1}`} onClick={() => setI(k)}><img src={m.url} alt="" /></button>
          ))}
        </div>
      )}
    </div>
  );
}
