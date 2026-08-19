import { describe, expect, it } from "vitest";

import {
  buildCustomPolicyPackQuoteHref,
  CUSTOM_POLICY_PACK_AUTHORING_SKUS,
  CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL,
} from "@/lib/marketing-custom-policy-pack-authoring";

describe("marketing-custom-policy-pack-authoring", () => {
  it("defines three SKUs aligned with PRICING_PHILOSOPHY §4.2 scope rows", () => {
    expect(CUSTOM_POLICY_PACK_AUTHORING_SKUS).toHaveLength(3);
    expect(CUSTOM_POLICY_PACK_AUTHORING_SKUS.map((sku) => sku.id)).toEqual([
      "starter",
      "standard",
      "program",
    ]);
  });

  it("builds quote deep link with interest query and hash anchor", () => {
    expect(buildCustomPolicyPackQuoteHref("pricing-quote-request")).toBe(
      "/pricing?interest=custom-policy-pack#pricing-quote-request",
    );
  });

  it("uses a distinct tier-interest label for quote submissions", () => {
    expect(CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL).toContain("professional services");
  });
});
