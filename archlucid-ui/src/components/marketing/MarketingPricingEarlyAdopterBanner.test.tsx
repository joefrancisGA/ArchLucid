import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingPricingEarlyAdopterBanner } from "./MarketingPricingEarlyAdopterBanner";
import { BUYER_EARLY_ADOPTER_PRICING_BANNER_SUMMARY } from "@/lib/buyer/buyer-polish-copy";

describe("MarketingPricingEarlyAdopterBanner", () => {
  it("renders a compact early-adopter summary with expandable full terms", () => {
    render(<MarketingPricingEarlyAdopterBanner showAiUsageNote />);

    expect(screen.getByTestId("pricing-early-adopter-framing")).toHaveTextContent(BUYER_EARLY_ADOPTER_PRICING_BANNER_SUMMARY);
    expect(screen.getByText(/View full early-adopter terms/i)).toBeInTheDocument();
    expect(screen.getByTestId("pricing-ai-usage-note")).toBeInTheDocument();
  });
});
