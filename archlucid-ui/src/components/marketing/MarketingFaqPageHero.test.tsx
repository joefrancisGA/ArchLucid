import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  MARKETING_FAQ_PAGE_INTRO,
  MARKETING_FAQ_VIEW_PRICING_LABEL,
} from "@/lib/marketing/marketing-faq-page-copy";

import { MarketingFaqPageHero } from "./MarketingFaqPageHero";

describe("MarketingFaqPageHero", () => {
  it("renders h1, intro, overview and pricing links, and top CTAs", () => {
    render(<MarketingFaqPageHero />);

    expect(screen.getByRole("heading", { level: 1, name: "Product FAQ" })).toHaveAttribute(
      "id",
      "marketing-faq-page-heading",
    );
    expect(screen.getByText(MARKETING_FAQ_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-hero-links")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to overview" })).toHaveAttribute("href", "/welcome");
    expect(screen.getByRole("link", { name: MARKETING_FAQ_VIEW_PRICING_LABEL })).toHaveAttribute("href", "/pricing");
    expect(screen.getByTestId("marketing-faq-cta-top")).toBeInTheDocument();
  });
});
