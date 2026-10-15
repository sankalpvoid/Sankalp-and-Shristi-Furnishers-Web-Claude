import type { ConfiguratorType, EnquiryStatus, Intent, ProductSource, ProductStatus, SalesMethod, Availability, Verification } from "./types";

export const CONFIGURATORS: Record<ConfiguratorType, { label: string; short: string; refPrefix: string; blurb: string; categorySlug: string }> = {
  bed: { label: "Bed", short: "Beds", refPrefix: "BED", blurb: "Size, headboard, finish and storage.", categorySlug: "beds" },
  sofa: { label: "Sofa", short: "Sofas", refPrefix: "SOFA", blurb: "Seating layout, fabric, legs and cushions.", categorySlug: "sofas" },
  sofa_bed: { label: "Sofa-cum-bed", short: "Sofa-cum-beds", refPrefix: "SCB", blurb: "A sofa by day, a bed at night.", categorySlug: "sofa-cum-beds" },
  dining: { label: "Dining table", short: "Dining tables", refPrefix: "DIN", blurb: "Shape, size, finish and chairs.", categorySlug: "dining-tables" },
};
export const CONFIGURATOR_URL_SLUG: Record<string, ConfiguratorType> = {
  bed: "bed",
  sofa: "sofa",
  "sofa-cum-bed": "sofa_bed",
  dining: "dining",
};
export const configuratorSlug = (t: ConfiguratorType) => (t === "sofa_bed" ? "sofa-cum-bed" : t);

export const ENQUIRY_STATUSES: { value: EnquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quotation_sent", label: "Quotation sent" },
  { value: "negotiating", label: "Negotiating" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];
export const statusLabel = (s: string) => ENQUIRY_STATUSES.find((x) => x.value === s)?.label ?? s;

export const INTENTS: { value: Intent; label: string; hint: string; cta: string }[] = [
  { value: "exploring", label: "I'm exploring designs", hint: "Save or share this design. No follow-up call unless you ask for one.", cta: "Save my design" },
  { value: "quote", label: "I'd like a quotation", hint: "Share your details and the team will come back with pricing.", cta: "Request a quotation" },
  { value: "visit", label: "I'd like to visit the showroom", hint: "Tell us when you plan to come; the team will confirm.", cta: "Plan my visit" },
  { value: "order", label: "I'm ready to order", hint: "The team will call to confirm details, final price and next steps. No payment is taken online.", cta: "Start my order" },
];

export const PRODUCT_STATUSES: { value: ProductStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "needs_review", label: "Needs review" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
  { value: "archived", label: "Archived" },
];
export const PRODUCT_SOURCES: { value: ProductSource; label: string }[] = [
  { value: "tally_import", label: "Imported from Tally inventory" },
  { value: "manual", label: "Added by owner" },
  { value: "proposed_seed", label: "Proposed seed product" },
  { value: "other_verified", label: "Other verified source" },
];
export const VERIFICATIONS: { value: Verification; label: string }[] = [
  { value: "verified", label: "Verified" },
  { value: "needs_review", label: "Needs review" },
  { value: "unverified", label: "Unverified" },
];
export const SALES_METHODS: { value: SalesMethod; label: string }[] = [
  { value: "quote", label: "Get price / request quote" },
  { value: "fixed_price", label: "Fixed price" },
  { value: "custom_config", label: "Custom configuration → quotation" },
  { value: "online_future", label: "Online purchase (future — not active)" },
];
export const AVAILABILITY: { value: Availability; label: string }[] = [
  { value: "enquire", label: "Enquire for availability" },
  { value: "in_stock", label: "In stock (verified)" },
  { value: "made_to_order", label: "Made to order" },
  { value: "out_of_stock", label: "Currently unavailable" },
];
export const availabilityLabel = (a: string) => AVAILABILITY.find((x) => x.value === a)?.label ?? a;

export const SESSION_COOKIE = "ssfi_admin";
