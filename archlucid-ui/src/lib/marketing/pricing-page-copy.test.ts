import { describe, expect, it } from "vitest";

import { BRAND_CATEGORY } from "@/lib/brand-category";
import {
  PRICING_PAGE_INTRO,
  PRICING_PAGE_TITLE,
  pricingPageBrandCategoryLead,
} from "@/lib/marketing/pricing-page-copy";

describe("pricing-page-copy", () => {
  it("uses product-safe pricing page naming", () => {
    expect(PRICING_PAGE_TITLE).toBe("Pricing");
    expect(PRICING_PAGE_INTRO).not.toMatch(/GET \/|proxy override|read-only API/i);
  });

  it("builds brand-category lead copy from the canonical category label", () => {
    const lead = pricingPageBrandCategoryLead(BRAND_CATEGORY);

    expect(lead).toContain(BRAND_CATEGORY);
    expect(lead).toMatch(/governed architecture review/i);
  });
});
