export type ProductStatus = "draft" | "needs_review" | "published" | "unpublished" | "archived";
export type ProductSource = "tally_import" | "manual" | "proposed_seed" | "other_verified";
export type Verification = "verified" | "needs_review" | "unverified";
export type SalesMethod = "fixed_price" | "quote" | "custom_config" | "online_future";
export type Availability = "in_stock" | "made_to_order" | "enquire" | "out_of_stock";
export type ConfiguratorType = "bed" | "sofa" | "sofa_bed" | "dining";
export type EnquiryStatus = "new" | "contacted" | "quotation_sent" | "negotiating" | "converted" | "lost";
export type Intent = "exploring" | "quote" | "visit" | "order";

export interface Category {
  id: number;
  slug: string;
  name: string;
  group_name: string;
  description: string;
  art_kind: string;
  image_url: string;
  sort_order: number;
  visible: number;
  origin: string;
}

export interface ProductRow {
  id: number;
  slug: string;
  sku: string;
  name: string;
  category_id: number | null;
  subcategory: string;
  short_description: string;
  description: string;
  material: string;
  finish: string;
  dimensions: string;
  sizes: string;
  colours: string;
  upholstery: string;
  config_notes: string;
  availability: Availability;
  quantity: number | null;
  price_inr: number | null;
  price_visibility: "hidden" | "show";
  sales_method: SalesMethod;
  online_purchase_approved: number;
  customisable: number;
  configurator: ConfiguratorType | "";
  warranty_text: string;
  model_url: string;
  art: string;
  status: ProductStatus;
  featured: number;
  source: ProductSource;
  verification: Verification;
  source_ref: string;
  import_id: number | null;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

/** Fields safe to send to a browser. Never includes quantity, notes, source refs. */
export interface PublicProduct {
  id: number;
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  subcategory: string;
  shortDescription: string;
  description: string;
  material: string;
  finish: string;
  dimensions: string;
  sizes: string[];
  colours: string[];
  upholstery: string[];
  availability: Availability;
  price: number | null; // only when owner approved
  salesMethod: SalesMethod;
  customisable: boolean;
  configurator: ConfiguratorType | "";
  warranty: string;
  art: ArtParams;
  images: { url: string; alt: string }[];
  featured: boolean;
  isSample: boolean; // unverified seed/draft data — shown with a label
}

export interface ArtParams {
  kind: string;
  wood?: string;
  fabric?: string;
  tone?: string;
  [k: string]: string | number | boolean | undefined;
}

export interface OptionValue {
  id: number;
  key: string;
  label: string;
  swatch: string;
  detail: string;
  enabled: number;
  verified: number;
  sort_order: number;
}
export interface OptionGroup {
  id: number;
  configurator: ConfiguratorType;
  key: string;
  label: string;
  help: string;
  kind: "choice" | "swatch";
  required: number;
  enabled: number;
  show_when: string;
  sort_order: number;
  values: OptionValue[];
}
export interface OptionRule {
  id: number;
  configurator: ConfiguratorType;
  if_group: string;
  if_value: string;
  then_group: string;
  then_value: string;
  note: string;
}

export type Selections = Record<string, string | number>;
export interface SummaryLine { label: string; value: string }

export interface ConfigurationRow {
  id: number;
  ref: string;
  configurator: ConfiguratorType;
  product_id: number | null;
  selections: string;
  summary: string;
  notes: string;
  preview_kind: string;
  created_at: string;
}

export interface EnquiryRow {
  id: number;
  type: string;
  intent: Intent;
  name: string;
  phone: string;
  email: string;
  contact_method: string;
  product_id: number | null;
  product_name: string;
  config_ref: string;
  message: string;
  preferred_date: string;
  categories: string;
  shortlist: string;
  status: EnquiryStatus;
  assigned_to: string;
  follow_up_date: string;
  created_at: string;
  updated_at: string;
}
