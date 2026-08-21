import { BUYER_MARKETING_PRICING_PAGE_INTRO } from "@/lib/buyer/buyer-polish-copy";

export const PRICING_PAGE_TITLE = "Pricing" as const;

export const PRICING_PRIMARY_CONTENT_ID = "pricing-primary-content" as const;

export const PRICING_SKIP_LINK_LABEL = "Skip to pricing content" as const;

export const PRICING_BREADCRUMB_HUB_LABEL = "Welcome" as const;

export const PRICING_BREADCRUMB_HUB_PATH = "/welcome" as const;

export const PRICING_BREADCRUMB_TOPIC_TITLE = PRICING_PAGE_TITLE;

export const PRICING_PAGE_INTRO = BUYER_MARKETING_PRICING_PAGE_INTRO;

export const PRICING_PAGE_FAQ_LINK_LABEL = "Product FAQ" as const;

export const PRICING_PAGE_FAQ_LINK_PREFIX = "More evaluation and security answers in the" as const;

export const PRICING_PAGE_BRAND_CATEGORY_DETAILS_TRIGGER = "Why ArchLucid?" as const;

export function pricingPageBrandCategoryLead(brandCategory: string): string {
  return `ArchLucid is an ${brandCategory} for architecture review, evidence traceability, and audit-ready sealed review records.`;
}
