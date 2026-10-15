import Link from "next/link";
export function SecHead({ eyebrow, title, link }: { eyebrow?: string; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="sec-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {link && <Link className="linkarrow" href={link.href}>{link.label}</Link>}
    </div>
  );
}
