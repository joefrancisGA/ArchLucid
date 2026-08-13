import { BUYER_MARKETING_PRICING_PAGE_INTRO } from "@/lib/buyer/buyer-polish-copy";

export const PRICING_PAGE_TITLE = "Pricing" as const;

export const PRICING_PAGE_INTRO = BUYER_MARKETING_PRICING_PAGE_INTRO;

export const PRICING_PAGE_FAQ_LINK_LABEL = "Product FAQ" as const;

export const PRICING_PAGE_FAQ_LINK_PREFIX = "More evaluation and security answers in the" as const;

export const PRICING_PAGE_BRAND_CATEGORY_DETAILS_TRIGGER = "Why ArchLucid?" as const;

export function pricingPageBrandCategoryLead(brandCategory: string): string {
  return `ArchLucid is an ${brandCategory} for governed architecture review, evidence traceability, and audit-ready signed review records.`;
}
