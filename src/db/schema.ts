/**
 * Database schema (SQLite). Kept as a plain SQL string so it is applied
 * automatically on first run — there is no undocumented manual setup.
 * Money is stored in whole rupees as integers (price_inr) — never floats.
 */
export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,            -- JSON
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT 'Other',
  description TEXT NOT NULL DEFAULT '',
  art_kind TEXT NOT NULL DEFAULT 'sofa',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  origin TEXT NOT NULL DEFAULT 'business_context'   -- business_context | proposed | owner
);

CREATE TABLE IF NOT EXISTS import_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'tally_csv',
  rows_total INTEGER NOT NULL DEFAULT 0,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  rows_skipped INTEGER NOT NULL DEFAULT 0,
  report TEXT NOT NULL DEFAULT '',
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  material TEXT NOT NULL DEFAULT '',
  finish TEXT NOT NULL DEFAULT '',
  dimensions TEXT NOT NULL DEFAULT '',
  sizes TEXT NOT NULL DEFAULT '[]',          -- JSON string[]
  colours TEXT NOT NULL DEFAULT '[]',        -- JSON string[]
  upholstery TEXT NOT NULL DEFAULT '[]',     -- JSON string[]
  config_notes TEXT NOT NULL DEFAULT '',
  availability TEXT NOT NULL DEFAULT 'enquire',     -- in_stock | made_to_order | enquire | out_of_stock
  quantity INTEGER,                                  -- internal; never shown publicly
  price_inr INTEGER,                                 -- customer-facing price when approved
  price_visibility TEXT NOT NULL DEFAULT 'hidden',   -- hidden | show
  sales_method TEXT NOT NULL DEFAULT 'quote',        -- fixed_price | quote | custom_config | online_future
  online_purchase_approved INTEGER NOT NULL DEFAULT 0, -- future e-commerce flag; checkout is NOT active
  customisable INTEGER NOT NULL DEFAULT 0,
  configurator TEXT NOT NULL DEFAULT '',             -- bed | sofa | sofa_bed | dining | ''
  warranty_text TEXT NOT NULL DEFAULT '',
  model_url TEXT NOT NULL DEFAULT '',                -- optional future 3D model (glb)
  art TEXT NOT NULL DEFAULT '{}',                    -- JSON params for the placeholder illustration
  status TEXT NOT NULL DEFAULT 'draft',              -- draft | needs_review | published | unpublished | archived
  featured INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',             -- tally_import | manual | proposed_seed | other_verified
  verification TEXT NOT NULL DEFAULT 'unverified',   -- verified | needs_review | unverified
  source_ref TEXT NOT NULL DEFAULT '',               -- e.g. Tally stock item name
  import_id INTEGER REFERENCES import_sources(id) ON DELETE SET NULL,
  internal_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Configurator option model -------------------------------------------------
CREATE TABLE IF NOT EXISTS option_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  configurator TEXT NOT NULL,          -- bed | sofa | sofa_bed | dining
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  help TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'choice', -- choice | swatch
  required INTEGER NOT NULL DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 1,
  show_when TEXT NOT NULL DEFAULT '',  -- JSON {groupKey: [valueKeys]} — only show this group when matched
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (configurator, key)
);

CREATE TABLE IF NOT EXISTS option_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  swatch TEXT NOT NULL DEFAULT '',     -- hex colour for swatches / preview
  detail TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  verified INTEGER NOT NULL DEFAULT 0, -- owner has confirmed this is really offered
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (group_id, key)
);

-- "If <if_group>=<if_value> then <then_group>=<then_value> is not available"
CREATE TABLE IF NOT EXISTS option_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  configurator TEXT NOT NULL,
  if_group TEXT NOT NULL,
  if_value TEXT NOT NULL,
  then_group TEXT NOT NULL,
  then_value TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);

-- Products may restrict a group to a subset of values.
CREATE TABLE IF NOT EXISTS product_option_limits (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_key TEXT NOT NULL,
  value_keys TEXT NOT NULL,            -- JSON string[]
  PRIMARY KEY (product_id, group_key)
);

-- Saved configurations: NEVER contain customer contact details ---------------
CREATE TABLE IF NOT EXISTS configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE,
  configurator TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  selections TEXT NOT NULL,            -- JSON {groupKey: valueKey | number}
  summary TEXT NOT NULL,               -- JSON [{label, value}]
  notes TEXT NOT NULL DEFAULT '',
  preview_kind TEXT NOT NULL DEFAULT 'layered',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Enquiries (also holds showroom-visit requests: type = 'visit') --------------
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                  -- general | product | configuration | quote | visit | order_intent
  intent TEXT NOT NULL DEFAULT 'exploring', -- exploring | quote | visit | order
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  contact_method TEXT NOT NULL DEFAULT 'phone',
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  config_ref TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  preferred_date TEXT NOT NULL DEFAULT '',
  categories TEXT NOT NULL DEFAULT '[]',
  shortlist TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'new',  -- new | contacted | quotation_sent | negotiating | converted | lost
  assigned_to TEXT NOT NULL DEFAULT '',
  follow_up_date TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_enq_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enq_cfg ON enquiries(config_ref);

CREATE TABLE IF NOT EXISTS enquiry_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_id INTEGER NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'staff',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rl ON rate_limits(bucket, ts);
`;
