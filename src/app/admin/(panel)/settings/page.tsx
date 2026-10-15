import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ActionForm } from "@/components/ActionForm";
import { saveSiteSettings, uploadAsset } from "../../actions";

export const metadata = { title: "Brand & contact" };

const T = ({ n, label, v, hint, type = "text" }: { n: string; label: string; v: string; hint?: string; type?: string }) => (
  <div className="field"><label htmlFor={n}>{label}</label><input className="input" id={n} name={n} type={type} defaultValue={v} />{hint && <span className="hint">{hint}</span>}</div>
);
const A = ({ n, label, v, rows = 3, hint }: { n: string; label: string; v: string; rows?: number; hint?: string }) => (
  <div className="field full"><label htmlFor={n}>{label}</label><textarea className="textarea" id={n} name={n} rows={rows} defaultValue={v} />{hint && <span className="hint">{hint}</span>}</div>
);

export default async function Settings() {
  await requireAdmin();
  const s = getSettings();
  return (
    <>
      <h1>Brand &amp; contact</h1>
      <div className="panel">
        <h2>Upload an image</h2>
        <p className="small muted">Upload a logo, hero or workshop photo, then paste the resulting address (e.g. <code>/uploads/…webp</code>) into the matching field below.</p>
        <ActionForm action={uploadAsset} submitLabel="Upload" encType="multipart/form-data" className="row"><input className="input" type="file" name="file" accept="image/*" required style={{ maxWidth: 340 }} aria-label="Image file" /></ActionForm>
      </div>
      <ActionForm action={saveSiteSettings} submitLabel="Save all settings">
        <div className="panel full"><h2>Brand</h2><div className="grid-form cols">
          <T n="brand.name" label="Business name" v={s.brand.name} /><T n="brand.tagline" label="Tagline" v={s.brand.tagline} />
          <T n="brand.logoText" label="Temporary logo text" v={s.brand.logoText} /><T n="brand.logoImage" label="Logo image address" v={s.brand.logoImage} hint="When set, replaces the SSFI text mark everywhere." />
          <A n="brand.description" label="Business description" v={s.brand.description} />
          <T n="hero.image" label="Homepage hero image address" v={s.hero.image} hint="Leave blank to show the illustration." /><T n="hero.imageAlt" label="Hero image description" v={s.hero.imageAlt} />
        </div></div>
        <div className="panel full"><h2>Contact &amp; showroom</h2><div className="grid-form cols">
          <T n="contact.phone" label="Phone" v={s.contact.phone} /><T n="contact.whatsapp" label="WhatsApp number (with country code)" v={s.contact.whatsapp} hint="e.g. 91XXXXXXXXXX. WhatsApp buttons stay hidden until this is set." />
          <T n="contact.email" label="Email" v={s.contact.email} type="email" /><T n="contact.mapUrl" label="Google Maps link" v={s.contact.mapUrl} />
          <A n="contact.address" label="Showroom address" v={s.contact.address} /><A n="contact.hours" label="Opening hours" v={s.contact.hours} hint="One line per day or range." />
          <T n="contact.instagram" label="Instagram URL" v={s.contact.instagram} /><T n="contact.facebook" label="Facebook URL" v={s.contact.facebook} /><T n="contact.youtube" label="YouTube URL" v={s.contact.youtube} />
        </div></div>
        <div className="panel full"><h2>Story &amp; trust wording</h2><div className="grid-form">
          <A n="story.legacyClaim" label="Showroom history claim (owner-provided)" v={s.story.legacyClaim} hint="Shown prominently on the homepage and showroom page. Verify before launch." />
          <A n="story.showroomIntro" label="Showroom introduction" v={s.story.showroomIntro} />
          <A n="story.workshopStory" label="Workshop story" v={s.story.workshopStory} />
          <A n="story.materialsStatement" label="Materials statement" v={s.story.materialsStatement} hint="Only claim what is true of the products described." />
          <T n="story.guaranteeHeadline" label="Guarantee headline" v={s.story.guaranteeHeadline} /><A n="story.guaranteeNote" label="Guarantee note" v={s.story.guaranteeNote} rows={2} hint="Add the real scope and exclusions here once confirmed." />
          <A n="story.sleepwellText" label="Sleepwell partner text" v={s.story.sleepwellText} rows={2} />
        </div></div>
        <div className="panel full"><h2>The Art of Making stages</h2><p className="small muted">Add a real workshop photograph address to replace the illustration for a stage.</p>
          {s.making.map((m, i) => (
            <div key={m.id} className="grid-form cols" style={{ marginBottom: 16 }}>
              <T n={`making.${i}.title`} label={`Stage ${i + 1} title`} v={m.title} /><T n={`making.${i}.image`} label="Photo address" v={m.image} />
              <A n={`making.${i}.caption`} label="Caption" v={m.caption} rows={2} />
            </div>
          ))}
        </div>
        <div className="panel full"><h2>Verification (internal)</h2>
          <label className="small" style={{ display: "block" }}><input type="checkbox" name="flags.legacyClaimVerified" defaultChecked={s.flags.legacyClaimVerified} /> I have verified the showroom history claim</label>
          <label className="small" style={{ display: "block" }}><input type="checkbox" name="flags.guaranteeVerified" defaultChecked={s.flags.guaranteeVerified} /> I have confirmed the five-year guarantee wording</label>
          <label className="small" style={{ display: "block" }}><input type="checkbox" name="flags.contactVerified" defaultChecked={s.flags.contactVerified} /> Contact details are final</label>
        </div>
      </ActionForm>
    </>
  );
}
