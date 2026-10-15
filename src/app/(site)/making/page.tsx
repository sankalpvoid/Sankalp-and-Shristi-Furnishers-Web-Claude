import type { Metadata } from "next";
import { MakingStory } from "@/components/MakingStory";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "The Art of Making" };

export default function Making() {
  const s = getSettings();
  return (
    <>
      <section className="making" style={{ paddingBottom: 0 }}>
        <div className="wrap" style={{ paddingBlock: "clamp(60px,9vw,130px) 40px" }}>
          <span className="eyebrow" style={{ color: "var(--gold-soft)" }}>The Art of Making</span>
          <h1>From raw wood to the room you live in</h1>
          <p className="lede" style={{ color: "#cfc6b6" }}>{s.story.workshopStory}</p>
          <p className="small" style={{ color: "#a79f91", maxWidth: "60ch" }}>The artwork below is illustrative. Photographs and film from our own workshop will replace it.</p>
        </div>
      </section>
      <MakingStory stages={s.making} />
    </>
  );
}
