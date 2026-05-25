import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingCustomPolicyPackAuthoringSection } from "@/components/marketing/MarketingCustomPolicyPackAuthoringSection";
import { CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL } from "@/lib/marketing-custom-policy-pack-authoring";

describe("MarketingCustomPolicyPackAuthoringSection", () => {
  it("renders SKU rows and canonical doc links without hard-coded list prices", () => {
    render(<MarketingCustomPolicyPackAuthoringSection />);

    expect(screen.getByTestId("custom-policy-pack-authoring-section")).toBeInTheDocument();
    expect(screen.getByTestId("custom-policy-pack-sku-starter")).toBeInTheDocument();
    expect(screen.getByTestId("custom-policy-pack-sku-standard")).toBeInTheDocument();
    expect(screen.getByTestId("custom-policy-pack-sku-program")).toBeInTheDocument();
    expect(screen.getByTestId("custom-policy-pack-pricing-philosophy-link")).toHaveAttribute(
      "href",
      expect.stringContaining("PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring"),
    );
    expect(screen.getByTestId("custom-policy-pack-sow-link")).toHaveAttribute(
      "href",
      expect.stringContaining("CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md"),
    );
    expect(screen.getByTestId("custom-policy-pack-order-form-link")).toHaveAttribute(
      "href",
      expect.stringContaining("ORDER_FORM_TEMPLATE.md#addendum-c"),
    );

    const sectionText = screen.getByTestId("custom-policy-pack-authoring-section").textContent ?? "";
    // Locked USD list prices must not appear in UI copy (canonical source: PRICING_PHILOSOPHY.md only).
    expect(sectionText).not.toMatch(/\$[\d,]+/);
    expect(sectionText).not.toContain(CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL);
  });

  it("links the CTA to the quote form with custom-pack interest", () => {
    render(<MarketingCustomPolicyPackAuthoringSection quoteSectionDomId="pricing-quote-request" />);

    expect(screen.getByTestId("custom-policy-pack-quote-cta")).toHaveAttribute(
      "href",
      "/pricing?interest=custom-policy-pack#pricing-quote-request",
    );
  });
});
