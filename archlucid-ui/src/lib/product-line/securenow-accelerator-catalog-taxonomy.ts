
import { SECURENOW_ACCELERATOR_INDEX_ROWS } from "@/lib/product-line/securenow-accelerator-index-copy";
import { SECURENOW_SPECIALTY_TEMPLATES_HREF } from "@/lib/product-line/securenow-accelerator-template-links";

export type SecureNowAcceleratorCatalogFamily = "collection" | "walks" | "procurement" | "templates";

export type SecureNowAcceleratorCatalogTag = SecureNowAcceleratorCatalogFamily | "all";

export type SecureNowAcceleratorCatalogMeta = {
  readonly href: string;
  readonly family: SecureNowAcceleratorCatalogFamily;
};

const FAMILY_BY_HREF: Record<string, SecureNowAcceleratorCatalogFamily> = {
  "/integrations/cloud-connections": "collection",
  "/infrastructure/manual-upload": "collection",
  "/infrastructure/snapshots-drift": "collection",
  "/administration/securenow-first-hour": "collection",
  "/administration/securenow-scenario-walks": "walks",
  "/administration/securenow-pilot-spine": "walks",
  "/administration/securenow-readout-pack": "walks",
  "/administration/securenow-reviewer-packet": "procurement",
  "/administration/securenow-quote-packet": "procurement",
  "/administration/securenow-specialty-templates": "templates",
  [SECURENOW_SPECIALTY_TEMPLATES_HREF]: "templates",
};

export const SECURENOW_ACCELERATOR_CATALOG_FILTER_LABELS: Record<SecureNowAcceleratorCatalogTag, string> = {
  all: "All",
  collection: "Collection",
  walks: "Fixture walks",
  procurement: "Procurement",
  templates: "Templates",
};

export function resolveSecureNowAcceleratorCatalogMeta(href: string): SecureNowAcceleratorCatalogMeta {
  const pathname = href.split(/[?#]/, 1)[0] ?? href;
  const family = FAMILY_BY_HREF[pathname] ?? "walks";
  return { href, family };
}

export function secureNowAcceleratorCatalogRows(): readonly SecureNowAcceleratorCatalogMeta[] {
  return SECURENOW_ACCELERATOR_INDEX_ROWS.map((row) => resolveSecureNowAcceleratorCatalogMeta(row.href));
}
