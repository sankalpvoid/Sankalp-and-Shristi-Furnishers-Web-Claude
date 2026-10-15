"use client";
import { useState } from "react";
import { Art } from "./art";
import type { PublicProduct } from "@/lib/types";

export function Gallery({ p }: { p: PublicProduct }) {
  const [i, setI] = useState(0);
  const img = p.images[i];
  return (
    <div>
      <div className="media pdp-main">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.url} alt={img.alt || p.name} />
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
