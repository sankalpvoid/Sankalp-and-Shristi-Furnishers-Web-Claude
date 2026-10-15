import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Configurator } from "@/components/Configurator";
import { CONFIGURATORS, CONFIGURATOR_URL_SLUG } from "@/lib/constants";
import { getConfiguration, getOptionGroups, getProductLimits, getPublishedProduct, getRules } from "@/lib/repo";
import { presetFromProduct } from "@/lib/preview";
import { getSettings } from "@/lib/settings";
import { parseJson } from "@/lib/util";
import type { Selections } from "@/lib/types";

type P = { params: Promise<{ type: string }>; searchParams: Promise<{ product?: string; ref?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = CONFIGURATOR_URL_SLUG[(await params).type];
  return { title: c ? `Design your ${CONFIGURATORS[c].label.toLowerCase()}` : "Design" };
}

export default async function DesignPage({ params, searchParams }: P) {
  const { type } = await params;
  const { product: productSlug, ref } = await searchParams;
  const conf = CONFIGURATOR_URL_SLUG[type];
  if (!conf) notFound();
  const product = productSlug ? getPublishedProduct(productSlug) : undefined;
  const validProduct = product && product.configurator === conf ? product : undefined;
  const groups = getOptionGroups(conf);
  const rules = getRules(conf);
  const limits = validProduct ? getProductLimits(validProduct.id) : {};
  let preset: Selections = validProduct ? presetFromProduct(conf, validProduct.art) : {};
  let startNote: string | undefined;
  if (ref) {
    const saved = getConfiguration(ref);
    if (saved && saved.configurator === conf) { preset = parseJson<Selections>(saved.selections, {}); startNote = `Starting from saved design ${saved.ref}. Saving again creates a new reference.`; }
  }
  const s = getSettings();
  return (
    <div className="wrap">
      <div className="page-head" style={{ paddingBottom: 24 }}>
        <div className="crumbs"><Link href="/design">Design your own</Link> / {CONFIGURATORS[conf].label}</div>
        <h1 style={{ fontSize: "clamp(2.2rem,4.5vw,3.6rem)" }}>Design your {CONFIGURATORS[conf].label.toLowerCase()}</h1>
        {validProduct && <p className="lede">Based on <Link href={`/product/${validProduct.slug}`}>{validProduct.name}</Link>.</p>}
      </div>
      <Configurator conf={conf} label={CONFIGURATORS[conf].label} groups={groups} rules={rules} limits={limits} preset={preset}
        productId={validProduct?.id} productName={validProduct?.name} waNumber={s.contact.whatsapp.replace(/\D/g, "")} startNote={startNote} />
    </div>
  );
}
