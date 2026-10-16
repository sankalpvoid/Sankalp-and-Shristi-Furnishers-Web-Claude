/**
 * Homepage manufacturing sequence (scroll-scrubbed video).
 * Source clips + order live in assets/manufacturing-videos/sequence.json; the prepare script
 * (`npm run prepare:making`) builds the files referenced below into public/making/.
 * The footage is AI-generated and temporary — keep `label` until it is replaced with real footage.
 */
export interface SequenceCaption {
  /** Scroll progress (0–1) during which this caption is visible. */
  from: number;
  to: number;
  eyebrow?: string;
  heading: string;
  /** Show the Explore / Design calls to action with this caption. */
  ctas?: boolean;
}

export interface MakingSequenceConfig {
  enabled: boolean;
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
  trackVh: 600,
  trackVhMobile: 480,
  smoothing: 0.16,
  label: "AI-generated placeholder footage and render · not our workshop",
  captions: [
    { from: 0, to: 0.16, eyebrow: "Sankalp & Shristi Furnishers", heading: "Crafted for Living", ctas: true },
    { from: 0.84, to: 1, eyebrow: "Made with intention", heading: "From frame to form", ctas: true },
  ],
};

/** `MAKING_SEQUENCE=1` forces it on (local testing); `MAKING_SEQUENCE=0` forces it off. */
export function sequenceEnabled(): boolean {
  if (process.env.MAKING_SEQUENCE === "1") return true;
  if (process.env.MAKING_SEQUENCE === "0") return false;
  return makingSequence.enabled;
}
