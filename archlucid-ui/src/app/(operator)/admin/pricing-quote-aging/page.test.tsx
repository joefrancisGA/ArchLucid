import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({
  callerAuthorityRank: 3,
  isAuthorityLoading: false,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: nav.callerAuthorityRank,
    isAuthorityLoading: nav.isAuthorityLoading,
  }),
}));

vi.mock("./_sections/load-pricing-quote-aging-page-data", () => ({
  loadPricingQuoteAgingPageData: async () => ({ demo: false }),
}));

import PricingQuoteAgingPage from "./page";

describe("PricingQuoteAgingPage", () => {
  it("shows forbidden when caller lacks admin authority", async () => {
    nav.callerAuthorityRank = 2;

    render(await PricingQuoteAgingPage());

    expect(screen.getByTestId("pricing-quote-aging-forbidden")).toBeInTheDocument();
    nav.callerAuthorityRank = 3;
  });
});
