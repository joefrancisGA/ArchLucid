/**
 * Single source of truth for the buyer-facing vertical-picker labels rendered on
 * `/get-started`. The CI guard `scripts/ci/assert_buyer_first_30_minutes_in_sync.py`
 * asserts this list matches the on-disk slugs under `templates/briefs/` exactly.
 */
export const BUYER_GET_STARTED_VERTICAL_SLUGS = [
  "financial-services",
  "healthcare",
  "public-sector",
  "public-sector-us",
  "retail",
  "saas",
] as const;

export type BuyerGetStartedVerticalSlug = (typeof BUYER_GET_STARTED_VERTICAL_SLUGS)[number];

/** @deprecated Use GET_STARTED_VERTICAL_PRESENTATIONS labels instead. */
export const VERTICAL_DISPLAY_NAMES: Record<BuyerGetStartedVerticalSlug, string> = {
  "financial-services": "Financial services",
  healthcare: "Healthcare",
  "public-sector": "Public sector",
  "public-sector-us": "US government",
  retail: "Retail",
  saas: "SaaS",
};
