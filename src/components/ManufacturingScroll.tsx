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
    const t = p * cfg.duration;
    return cfg.captions.findIndex((c) => t >= c.fromS && t <= c.toS);
  }, [cfg.captions, cfg.duration]);

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
      if (bar.current) {
        bar.current.style.transform = `scaleX(${p})`;
        const t = p * cfg.duration;
        bar.current.parentElement?.querySelectorAll<HTMLElement>("i[data-from]").forEach((tick) => { tick.dataset.on = t >= Number(tick.dataset.from) ? "true" : "false"; });
      }
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
  }, [isStatic, src, cfg.smoothing, cfg.duration, activeCaption]);

  const last = cfg.captions.length - 1;
  const shown = isStatic ? last : caption;

  return (
    <section
      ref={root}
      className={`mk-seq dark ${isStatic ? "is-static" : ""} ${ready ? "is-ready" : ""}`}
      style={{ "--track-vh": cfg.trackVh, "--track-vh-m": cfg.trackVhMobile } as React.CSSProperties}
      aria-label="How a sofa is made: a scroll-controlled sequence of placeholder footage"
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
        {cfg.captions.map((c, i) => {
          if (isStatic && i !== last) return null;
          const on = i === shown;
          if (c.kind === "stage") {
            return (
              <div key={c.heading} className="mk-seq-stage" data-on={on ? "true" : "false"} aria-hidden="true">
                <span className="n">{String(c.step).padStart(2, "0")}<i>/{String(cfg.stages).padStart(2, "0")}</i></span>
                <h2>{c.heading}</h2>
              </div>
            );
          }
          return (
            <div key={c.heading} className="mk-seq-cap" data-on={on ? "true" : "false"} aria-hidden={on ? undefined : "true"}>
              {c.eyebrow && <span className="eyebrow">{c.eyebrow}</span>}
              <h2>{c.heading}</h2>
              {c.sub && <p className="mk-seq-sub">{c.sub}</p>}
              {c.ctas && i === last && (
                <div className="row mk-seq-ctas">
                  <Link className="btn gold" href="/shop" tabIndex={on ? 0 : -1}>Explore Furniture</Link>
                  <Link className="btn ghost" href="/design" tabIndex={on ? 0 : -1}>Design Your Own</Link>
                  <Link className="btn ghost" href="/contact?intent=visit" tabIndex={on ? 0 : -1}>Plan a Visit</Link>
                </div>
              )}
              {c.ctas && i !== last && (
                <div className="row mk-seq-ctas">
                  <Link className="btn gold" href="/shop" tabIndex={on ? 0 : -1}>Explore Furniture</Link>
                  <Link className="btn ghost" href="/design" tabIndex={on ? 0 : -1}>Design Your Own</Link>
                </div>
              )}
              {i === last && <p className="mk-seq-more"><Link className="linkarrow" href="/making" tabIndex={on ? 0 : -1}>See the stages in full</Link></p>}
            </div>
          );
        })}
        {!isStatic && <a className="mk-seq-skipbtn" href="#after-sequence">Skip animation <span aria-hidden>↓</span></a>}
        <span className="mk-seq-label">{cfg.label}</span>
        {!isStatic && (
          <div className="mk-seq-progress" aria-hidden="true">
            <div ref={bar} />
            {cfg.captions.filter((c) => c.kind === "stage").map((c) => (
              <i key={c.heading} style={{ left: `${((c.fromS - 0.4) / cfg.duration) * 100}%` }} data-from={c.fromS - 0.4} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
