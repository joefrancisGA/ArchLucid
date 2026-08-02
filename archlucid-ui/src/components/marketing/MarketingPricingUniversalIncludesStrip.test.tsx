import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingPricingUniversalIncludesStrip } from "./MarketingPricingUniversalIncludesStrip";
import { MARKETING_PRICING_UNIVERSAL_INCLUDES } from "@/lib/marketing/marketing-pricing-tier-display";

describe("MarketingPricingUniversalIncludesStrip", () => {
  it("renders the universal includes reassurance strip", () => {
    render(<MarketingPricingUniversalIncludesStrip />);

    expect(screen.getByTestId("pricing-universal-includes-strip")).toBeInTheDocument();
    expect(screen.getByText("Included in every plan")).toBeInTheDocument();

    for (const item of MARKETING_PRICING_UNIVERSAL_INCLUDES) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });
});
