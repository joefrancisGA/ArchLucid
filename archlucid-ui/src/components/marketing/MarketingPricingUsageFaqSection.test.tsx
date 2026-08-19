import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingPricingUsageFaqSection } from "./MarketingPricingUsageFaqSection";
import { MARKETING_PRICING_USAGE_FAQ_ITEMS } from "@/lib/marketing/marketing-public-pricing";

describe("MarketingPricingUsageFaqSection", () => {
  it("renders usage FAQ items as expandable accordions", () => {
    render(<MarketingPricingUsageFaqSection />);

    expect(screen.getByTestId("pricing-usage-faq-section")).toBeInTheDocument();

    for (const item of MARKETING_PRICING_USAGE_FAQ_ITEMS) {
      expect(screen.getByText(item.question)).toBeInTheDocument();
      expect(screen.getByText(item.answer)).toBeInTheDocument();
    }
  });
});
