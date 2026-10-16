"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MakingSequenceConfig } from "@/config/making-sequence";

/**
 * Scroll-scrubbed manufacturing sequence.
 *
 * A tall "track" section contains a sticky frame (CSS pinning, so normal scrolling elsewhere is
 * untouched and the pin releases by itself at the end). While the frame is pinned, scroll progress
 * 0→1 maps to the video's currentTime, so scrolling down plays it forward and up plays it backward.
 *
 * Fallbacks: reduced-motion / data-saver / a failed video all render a static, un-pinned panel
 * with the finished frame, so the page never depends on the video.
 */
export function ManufacturingScroll({ cfg }: { cfg: MakingSequenceConfig }) {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"scrub" | "static">("scrub");
  const [failed, setFailed] = useState(false);
  const [src, setSrc] = useState<string | undefined>();
  const [caption, setCaption] = useState(0);
  const [ready, setReady] = useState(false);
  const [near, setNear] = useState(false);
  const isStatic = mode === "static" || failed;

  // Decide scrub vs static (reduced motion / data saver) once on the client.
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const decide = () => setMode(rm.matches || conn?.saveData ? "static" : "scrub");
    decide();
    rm.addEventListener("change", decide);
    return () => rm.removeEventListener("change", decide);
  }, []);

  // Only fetch the video when the section is within ~2 screens of the viewport.
  useEffect(() => {
    if (isStatic || !root.current) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setNear(true)), { rootMargin: "200% 0px" });
    io.observe(root.current);
    return () => io.disconnect();
  }, [isStatic]);

  useEffect(() => {
    if (!near || isStatic) return;
    const small = window.matchMedia("(max-width: 768px)").matches;
    setSrc(small ? cfg.videoSmall : cfg.video);
  }, [near, isStatic, cfg.video, cfg.videoSmall]);

  const activeCaption = useCallback((p: number) => {
    const i = cfg.captions.findIndex((c) => p >= c.from && p <= c.to);
    return i;
  }, [cfg.captions]);

  // Scroll → video time.
  useEffect(() => {
    const el = root.current, vid = video.current, pinEl = pin.current;
    if (isStatic || !el || !vid || !pinEl || !src) return;
    let target = 0, current = 0, raf = 0, inView = false, unlocked = false, lastCaption = -2;
    const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 76;
    const duration = () => (Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration : 1);

    const measure = () => {
      const r = el.getBoundingClientRect();
      const total = Math.max(1, r.height - pinEl.offsetHeight);
      const p = Math.min(1, Math.max(0, (headerH() - r.top) / total));
      target = p * duration();
      const c = activeCaption(p);
      if (c !== lastCaption) { lastCaption = c; setCaption(c); }
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const tick = () => {
      raf = 0;
      current += (target - current) * cfg.smoothing;
      if (Math.abs(target - current) < 0.004) current = target;
      if (vid.readyState >= 2 && !vid.seeking && Math.abs(vid.currentTime - current) > 1 / 90) vid.currentTime = current;
      if (current !== target || vid.seeking) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf && inView) raf = requestAnimationFrame(tick); };
    const onScroll = () => {
      measure();
      // Some mobile browsers only paint seeked frames after the first play()/pause().
      if (!unlocked) { unlocked = true; vid.play().then(() => vid.pause()).catch(() => {}); }
      kick();
    };
    const onMeta = () => { setReady(true); measure(); current = target; vid.currentTime = current; };
    const io = new IntersectionObserver((es) => { inView = es.some((e) => e.isIntersecting); if (inView) { measure(); kick(); } }, { rootMargin: "20% 0px" });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    vid.addEventListener("loadedmetadata", onMeta);
    if (vid.readyState >= 1) onMeta();
    measure();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      vid.removeEventListener("loadedmetadata", onMeta);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isStatic, src, cfg.smoothing, activeCaption]);

  const last = cfg.captions[cfg.captions.length - 1];
  const caps = isStatic ? [last] : cfg.captions;
  const shown = isStatic ? 0 : caption;

  return (
    <section
      ref={root}
      className={`mk-seq dark ${isStatic ? "is-static" : ""} ${ready ? "is-ready" : ""}`}
      style={{ "--track-vh": cfg.trackVh, "--track-vh-m": cfg.trackVhMobile } as React.CSSProperties}
      aria-label="How we make a sofa — sequence of placeholder footage"
    >
      <a className="mk-seq-skip" href="#after-sequence">Skip the animation</a>
      <div className="mk-seq-pin" ref={pin}>
        <div className="mk-seq-media">
          {/* Poster / finished frame: always present so nothing shifts or goes blank. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mk-seq-still" src={isStatic ? cfg.finalFrame : cfg.poster} alt="" decoding="async" fetchPriority="high" />
          {!isStatic && src && (
            <video
              ref={video}
              className="mk-seq-video"
              src={src}
              poster={cfg.poster}
              muted
              playsInline
              preload="auto"
              tabIndex={-1}
              aria-hidden="true"
              onError={() => setFailed(true)}
            />
          )}
        </div>
        {caps.map((c, i) => (
          <div key={c.heading} className="mk-seq-cap" data-on={i === shown ? "true" : "false"} aria-hidden={i === shown ? undefined : "true"}>
            {c.eyebrow && <span className="eyebrow">{c.eyebrow}</span>}
            <h2>{c.heading}</h2>
            {c.ctas && (
              <div className="row" style={{ marginTop: 22 }}>
                <Link className="btn gold" href="/shop" tabIndex={i === shown ? 0 : -1}>Explore Furniture</Link>
                <Link className="btn ghost" href="/design" tabIndex={i === shown ? 0 : -1}>Design Your Own</Link>
              </div>
            )}
          </div>
        ))}
        <span className="mk-seq-label">{cfg.label}</span>
        {!isStatic && <div className="mk-seq-progress" aria-hidden="true"><div ref={bar} /></div>}
        {!isStatic && <span className="mk-seq-hint" aria-hidden="true">Scroll</span>}
      </div>
    </section>
  );
}
