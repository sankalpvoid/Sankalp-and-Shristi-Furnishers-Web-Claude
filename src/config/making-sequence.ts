/**
 * Homepage manufacturing sequence (scroll-scrubbed video).
 * Source clips + order live in assets/manufacturing-videos/sequence.json; the prepare script
 * (`npm run prepare:making`) builds the files referenced below into public/making/.
 * The footage is AI-generated and temporary — keep `label` until it is replaced with real footage.
 */
export interface SequenceCaption {
  /** Seconds on the sequence timeline (see public/making/sequence.meta.json "start") during which this caption shows. */
  fromS: number;
  toS: number;
  /** "feature" = large panel with calls to action; "stage" = small step label that names what is on screen. */
  kind: "feature" | "stage";
  /** Step number for "stage" captions. */
  step?: number;
  eyebrow?: string;
  heading: string;
  /** One supporting line under a feature heading. */
  sub?: string;
  /** Show the Explore / Design calls to action with this caption. */
  ctas?: boolean;
}

export interface MakingSequenceConfig {
  enabled: boolean;
  /** Length of public/making/sequence.mp4 in seconds. Used to map scroll progress to captions. */
  duration: number;
  stages: number;
  video: string;
  videoSmall: string;
  poster: string;
  finalFrame: string;
  /** Pinned scroll distance, in viewport heights, on desktop and on phones. */
  trackVh: number;
  trackVhMobile: number;
  /** 0–1: how quickly the video follows the scroll position (higher = snappier). */
  smoothing: number;
  label: string;
  captions: SequenceCaption[];
}

export const makingSequence: MakingSequenceConfig = {
  enabled: true, // built from assets/manufacturing-videos via `npm run prepare:making`
  video: "/making/sequence.mp4",
  videoSmall: "/making/sequence-sm.mp4",
  poster: "/making/poster.jpg",
  finalFrame: "/making/final.jpg",
  duration: 35.5,
  stages: 6,
  trackVh: 400,
  trackVhMobile: 330,
  smoothing: 0.16,
  label: "AI-generated placeholder footage and render · not our workshop",
  // Times follow "start" in sequence.meta.json: 0 plank · 3.15 cutting · 8.3 sanding · 13.05 assembly · 17.3 finish · 21.6 sofa frame · 25.4 upholstery · 33 render.
  captions: [
    { kind: "feature", fromS: 0, toS: 3.0, eyebrow: "Sankalp & Shristi Furnishers", heading: "Crafted for Living", sub: "Scroll to watch a sofa come together, or skip straight to the furniture.", ctas: true },
    { kind: "stage", step: 1, fromS: 3.5, toS: 8.2, heading: "Timber, cut to size" },
    { kind: "stage", step: 2, fromS: 8.6, toS: 13, heading: "Surfaces, smoothed" },
    { kind: "stage", step: 3, fromS: 13.3, toS: 17.2, heading: "A frame comes together" },
    { kind: "stage", step: 4, fromS: 17.6, toS: 21.5, heading: "The finish goes on" },
    { kind: "stage", step: 5, fromS: 21.9, toS: 25.3, heading: "A sofa frame takes shape" },
    { kind: "stage", step: 6, fromS: 25.7, toS: 32.4, heading: "Fabric is fitted" },
    { kind: "feature", fromS: 32.7, toS: 36, eyebrow: "Made with intention", heading: "From frame to form", sub: "Browse the finished range, design your own, or talk to the showroom.", ctas: true },
  ],
};

/** `MAKING_SEQUENCE=1` forces it on (local testing); `MAKING_SEQUENCE=0` forces it off. */
export function sequenceEnabled(): boolean {
  if (process.env.MAKING_SEQUENCE === "1") return true;
  if (process.env.MAKING_SEQUENCE === "0") return false;
  return makingSequence.enabled;
}
