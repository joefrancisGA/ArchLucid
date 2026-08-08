import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PricingQuoteAgingEvidenceOrientationStrip } from "@/app/(operator)/internal/pricing-quote-aging/_sections/PricingQuoteAgingEvidenceOrientationStrip";
import {
  PRICING_QUOTE_AGING_CANONICAL_PATH,
  PRICING_QUOTE_AGING_SOURCES,
} from "@/lib/pricing-quote-aging-evidence-copy";

describe("PricingQuoteAgingEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking pricing-quote-aging", () => {
    render(<PricingQuoteAgingEvidenceOrientationStrip />);

    expect(screen.getByTestId("pricing-quote-aging-sources")).toBeInTheDocument();
    expect(screen.getByTestId("pricing-quote-aging-claim-discipline")).toBeInTheDocument();

    for (const link of PRICING_QUOTE_AGING_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(PRICING_QUOTE_AGING_SOURCES.some((link) => link.href === PRICING_QUOTE_AGING_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
