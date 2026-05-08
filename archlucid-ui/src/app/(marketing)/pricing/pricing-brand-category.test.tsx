import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BRAND_CATEGORY, BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";

import PricingPage from "./page";

describe("PricingPage brand category", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            schemaVersion: 1,
            currency: "USD",
            packages: [
              {
                id: "pilot",
                title: "Pilot",
                summary: "Pilot summary",
                workspaceMonthlyUsd: 100,
                seatMonthlyUsd: 10,
                annualFloorUsd: 1200,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the brand-category paragraph using BRAND_CATEGORY (not the legacy string)", async () => {
    const element = await PricingPage({ searchParams: Promise.resolve({}) });
    const { getByTestId } = render(element);

    const paragraph = getByTestId("pricing-brand-category-paragraph");
    const text = paragraph.textContent ?? "";

    expect(text).toContain(BRAND_CATEGORY);
    expect(text).not.toContain(BRAND_CATEGORY_LEGACY);
  });

  it("renders the quote request section before the tier pricing heading (sales-led layout)", async () => {
    const element = await PricingPage({ searchParams: Promise.resolve({}) });
    const { container, getByTestId } = render(element);

    getByTestId("pricing-quote-request-section");

    const quoteSection = container.querySelector('[data-testid="pricing-quote-request-section"]');
    const pricingHeading = container.querySelector("#pricing-page-heading");

    if (quoteSection === null || pricingHeading === null) {
      throw new Error("expected quote section and pricing heading in DOM");
    }

    const position = quoteSection.compareDocumentPosition(pricingHeading);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
