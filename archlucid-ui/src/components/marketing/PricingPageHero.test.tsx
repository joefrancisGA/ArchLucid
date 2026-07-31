import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PRICING_PAGE_INTRO } from "@/lib/marketing/pricing-page-copy";

import { PricingPageHero } from "./PricingPageHero";

describe("PricingPageHero", () => {
  it("renders h1, intro, and Product FAQ link in the first viewport", () => {
    render(<PricingPageHero />);

    expect(screen.getByRole("heading", { level: 1, name: "Pricing" })).toHaveAttribute("id", "pricing-page-heading");
    expect(screen.getByText(PRICING_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("pricing-faq-link-line")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Product FAQ" })).toHaveAttribute("href", "/faq");
  });
});
