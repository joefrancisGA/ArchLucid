import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PricingQuoteAgingPageView } from "./PricingQuoteAgingPageView";
import type { PricingQuoteAgingPageViewModel } from "./use-pricing-quote-aging-page";

function adminModel(overrides: Partial<PricingQuoteAgingPageViewModel> = {}): PricingQuoteAgingPageViewModel {
  return {
    surface: "admin",
    loading: false,
    data: {
      rows: [],
      warnCount: 0,
      breachCount: 0,
    },
    error: null,
    lastRefreshedAt: new Date("2026-07-07T12:00:00Z"),
    refresh: async () => undefined,
    ...overrides,
  };
}

describe("PricingQuoteAgingPageView", () => {
  it("shows internal sales operations chrome and empty-state headline", () => {
    render(<PricingQuoteAgingPageView model={adminModel()} />);

    expect(screen.getByTestId("pricing-quote-follow-up-title")).toHaveTextContent("Pricing quote follow-up");
    expect(screen.queryByTestId("pricing-quote-aging-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText("Internal sales operations")).toBeInTheDocument();
    expect(screen.getByTestId("pricing-quote-follow-up-headline")).toHaveTextContent(
      "No open pricing quote requests",
    );
    expect(screen.getByTestId("pricing-quote-follow-up-empty")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Buyer / company" })).toBeInTheDocument();
    expect(screen.queryByTestId("pricing-quote-follow-up-support-details")).not.toBeInTheDocument();
  });

  it("shows breach headline and SLA badges for loaded rows", () => {
    render(
      <PricingQuoteAgingPageView
        model={adminModel({
          data: {
            rows: [
              {
                id: "row-1",
                createdUtc: "2026-07-01T10:00:00Z",
                ageHours: 26,
                breachStatus: "breach at 24h",
                workEmail: "buyer@acme.example",
                companyName: "Acme",
                tierInterest: "Enterprise",
                status: "Open",
                firstResponseUtc: null,
                assignedOwner: null,
              },
            ],
            warnCount: 0,
            breachCount: 1,
          },
        })}
      />,
    );

    expect(screen.getByTestId("pricing-quote-follow-up-headline")).toHaveTextContent("1 request past follow-up SLA");
    expect(screen.getByTestId("pricing-quote-aging-row")).toHaveTextContent("Past SLA");
    expect(screen.getByRole("button", { name: "Mark contacted" })).toBeInTheDocument();
  });
});
