import type { Metadata } from "next";
import { MakingStory } from "@/components/MakingStory";
import { getSettings } from "@/lib/settings";
import { siteRender } from "@/lib/renders";

export const metadata: Metadata = { title: "The Art of Making" };

export default function Making() {
  const s = getSettings();
  const stages = s.making.map((m) => ({ ...m, render: m.image ? null : siteRender(`making/${m.id}`) }));
  const hasIllustration = stages.some((m) => !m.image);
  return (
    <>
      <section className="mk-hero">
        <div className="wrap">
          <div>
            <span className="eyebrow">The Art of Making</span>
            <h1>From raw wood to the room you live in</h1>
          </div>
          <div>
            <p className="lede">{s.story.workshopStory}</p>
            {hasIllustration && <p className="mk-note">The imagery on this page is illustrative — studio renders and artwork, not photographs of our workshop. Our own photographs and film will replace it.</p>}
          </div>
        </div>
      </section>
      <MakingStory stages={stages} />
    </>
  );
}
