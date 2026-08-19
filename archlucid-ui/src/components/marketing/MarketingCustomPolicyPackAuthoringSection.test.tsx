import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingCustomPolicyPackAuthoringSection } from "@/components/marketing/MarketingCustomPolicyPackAuthoringSection";
import {
  CUSTOM_POLICY_PACK_SOW_HREF,
  CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL,
} from "@/lib/marketing-custom-policy-pack-authoring";

describe("MarketingCustomPolicyPackAuthoringSection", () => {
  it("renders SKU rows and SoW link without hard-coded list prices", () => {
    render(<MarketingCustomPolicyPackAuthoringSection />);

    expect(screen.getByTestId("custom-policy-pack-authoring-section")).toBeInTheDocument();
    expect(screen.getByTestId("custom-policy-pack-sku-starter")).toBeInTheDocument();
    expect(screen.getByTestId("custom-policy-pack-sku-standard")).toBeInTheDocument();
    expect(screen.getByTestId("custom-policy-pack-sku-program")).toBeInTheDocument();
    expect(screen.getByTestId("custom-policy-pack-sow-link")).toHaveAttribute("href", CUSTOM_POLICY_PACK_SOW_HREF);
    expect(screen.getByRole("heading", { name: /optional professional services/i })).toBeInTheDocument();

    const sectionText = screen.getByTestId("custom-policy-pack-authoring-section").textContent ?? "";
    expect(sectionText).not.toMatch(/\$[\d,]+/);
    expect(sectionText).not.toContain(CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL);
    expect(sectionText).not.toContain("PRICING_PHILOSOPHY");
  });

  it("links the CTA to the quote form with custom-pack interest", () => {
    render(<MarketingCustomPolicyPackAuthoringSection quoteSectionDomId="pricing-quote-request" />);

    expect(screen.getByTestId("custom-policy-pack-quote-cta")).toHaveAttribute(
      "href",
      "/pricing?interest=custom-policy-pack#pricing-quote-request",
    );
  });
});
