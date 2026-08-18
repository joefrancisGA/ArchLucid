import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BRAND_CATEGORY, BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";
import {
  PRICING_PRIMARY_CONTENT_ID,
  PRICING_SKIP_LINK_LABEL,
} from "@/lib/marketing/pricing-page-copy";

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
                id: "architect",
                title: "Architect",
                summary: "For one architect",
                planMonthlyUsd: 99,
                pricingDisplay: "monthly",
                includedUsers: 1,
                includedWorkspaces: 1,
                monthlyAiCredits: 500,
              },
              {
                id: "team",
                title: "Team",
                summary: "Team summary",
                planMonthlyUsd: 249,
                pricingDisplay: "monthly",
                includedUsers: 5,
                includedWorkspaces: 1,
                monthlyAiCredits: 2500,
              },
              {
                id: "professional",
                title: "Professional",
                summary: "Professional summary",
                planMonthlyUsd: 1799,
                pricingDisplay: "monthly",
                includedUsers: 15,
                includedWorkspaces: 5,
                monthlyAiCredits: 10000,
              },
              {
                id: "enterprise",
                title: "Enterprise",
                summary: "Enterprise summary",
                pricingDisplay: "custom",
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

  it("renders custom policy pack professional services before the quote form", async () => {
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

  it("renders a page-level h1 hero with FAQ link before the tier grid", async () => {
    const element = await PricingPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByRole("link", { name: PRICING_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PRICING_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("pricing-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("pricing-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("pricing-page-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Pricing" })).toBeInTheDocument();
    expect(screen.getByTestId("pricing-faq-link-line").querySelector('a[href="/faq"]')).toBeTruthy();
    expect(screen.getAllByTestId("pricing-sources")).toHaveLength(1);
    expect(screen.queryByTestId("pricing-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Pricing" })).not.toBeInTheDocument();
  });

  it("renders usage FAQ and AI usage note on the pricing page", async () => {
    const element = await PricingPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByTestId("pricing-usage-faq-section")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("pricing-ai-usage-note")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("pricing-sales-led-v1-note")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pricing-single-footnote")).not.toBeInTheDocument();
  });
});
