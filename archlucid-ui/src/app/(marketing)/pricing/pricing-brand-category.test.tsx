import { render, screen } from "@testing-library/react";
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
    expect(text).toContain("request a quote");
  });

  it("renders a single consolidated pricing caveat above the quote form", async () => {
    const element = await PricingPage({ searchParams: Promise.resolve({}) });
    const { getByTestId } = render(element);

    const footnote = getByTestId("pricing-single-footnote");
    expect(footnote.textContent ?? "").toContain("Final pricing depends on deployment scope");

    const caveats = screen.queryAllByText(/Final pricing depends/s);
    expect(caveats.length).toBe(1);
  });

  it("renders custom policy pack authoring GTM section before the quote form", async () => {
    const element = await PricingPage({ searchParams: Promise.resolve({}) });
    const { getByTestId } = render(element);

    expect(getByTestId("custom-policy-pack-authoring-section")).toBeInTheDocument();
    expect(getByTestId("custom-policy-pack-quote-cta")).toHaveAttribute(
      "href",
      "/pricing?interest=custom-policy-pack#pricing-quote-request",
    );
  });

  it("renders the tier pricing heading before the quote request section (plans before lead capture)", async () => {
    const element = await PricingPage({ searchParams: Promise.resolve({}) });
    const { container, getByTestId } = render(element);

    getByTestId("pricing-quote-request-section");

    const quoteSection = container.querySelector('[data-testid="pricing-quote-request-section"]');
    const pricingHeading = container.querySelector("#pricing-page-heading");

    if (quoteSection === null || pricingHeading === null) {
      throw new Error("expected quote section and pricing heading in DOM");
    }

    const position = quoteSection.compareDocumentPosition(pricingHeading);
    expect(position & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });
});
