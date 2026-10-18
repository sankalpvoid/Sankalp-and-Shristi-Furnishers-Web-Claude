"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * One reveal for the whole site: content rises 24px and fades in once, as it scrolls into view.
 * `mask` is the image variant (a clip-path wipe with a slow settle). Content is fully visible
 * without JavaScript and with reduced motion (see design.css), so nothing depends on this running.
 */
export function Reveal({ children, className = "", delay = 0, mask = false, as = "div" }: {
  children: ReactNode;
  className?: string;
  delay?: number;
  mask?: boolean;
  as?: "div" | "li" | "section" | "article" | "p" | "span";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add(mask ? "rv-mask" : "rv");
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [mask]);
  const T = as as "div";
  const style: CSSProperties | undefined = delay ? { transitionDelay: `${delay}ms` } : undefined;
  return <T ref={ref as React.RefObject<HTMLDivElement>} className={className} style={style}>{children}</T>;
}
