import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

import { MarketingTierPricingSection } from "./MarketingTierPricingSection";

const mockPricingDoc = {
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
      summary: "Team tier",
      planMonthlyUsd: 249,
      pricingDisplay: "monthly",
      includedUsers: 5,
      includedWorkspaces: 1,
      monthlyAiCredits: 2500,
      workspaceMonthlyUsd: 199,
      seatMonthlyUsd: 79,
    },
    {
      id: "professional",
      title: "Professional",
      summary: "Pro tier",
      planMonthlyUsd: 1799,
      pricingDisplay: "monthly",
      includedUsers: 15,
      includedWorkspaces: 5,
      monthlyAiCredits: 10000,
      workspaceMonthlyUsd: 899,
      seatMonthlyUsd: 179,
    },
    {
      id: "enterprise",
      title: "Enterprise",
      summary: "Ent tier",
      pricingDisplay: "custom",
    },
  ],
  teamStripeCheckoutUrl: "https://pay.example.test/checkout",
  architectStripeCheckoutUrl: "https://pay.example.test/architect-checkout",
};

describe("MarketingTierPricingSection", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPricingDoc,
      }),
    );
  });

  afterEach(() => {
    resetOperatorQueryClientForTests();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("renders Architect first with self-serve signup when Stripe checkout is disabled", async () => {
    render(
      <MarketingTierPricingSection sectionHeadingId="pricing-heading" sectionTitle="Pricing" signupHref="/signup?utm_source=pricing_page" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Architect" })).toBeInTheDocument();
    });

    const architectCard = screen.getByTestId("pricing-tier-architect");
    within(architectCard).getByText(/Best for/i);
    within(architectCard).getByRole("link", { name: /start architect plan/i });
    expect(screen.getByTestId("pricing-tier-price-enterprise")).toHaveTextContent("Custom");
    expect(screen.getByTestId("pricing-fit-matrix")).toBeInTheDocument();
    expect(screen.getByTestId("pricing-universal-includes-strip")).toBeInTheDocument();
    expect(screen.getByText(/Recommended plan/i)).toBeInTheDocument();
    expect(screen.queryByTestId("pricing-early-adopter-framing")).toHaveTextContent(/Early adopter pricing/i);
  });

  it("renders server-supplied pricing synchronously without the loading skeleton or a client fetch", () => {
    render(
      <MarketingTierPricingSection
        sectionHeadingId="pricing-heading"
        sectionTitle="Pricing"
        signupHref="/signup"
        initialPricing={mockPricingDoc as never}
      />,
    );

    expect(screen.getByRole("heading", { name: "Architect" })).toBeInTheDocument();
    expect(screen.queryAllByTestId("pricing-tier-skeleton")).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("routes Team primary CTA to in-app billing when self-serve checkout is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED", "true");

    render(
      <MarketingTierPricingSection sectionHeadingId="pricing-heading" sectionTitle="Pricing" signupHref="/signup?utm=test" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    });

    const teamCard = screen.getByRole("heading", { name: "Team" }).closest("li");
    if (teamCard === null) {
      throw new Error("expected Team tier list item");
    }

    const teamScope = within(teamCard);
    const billingLink = teamScope.getByTestId("pricing-team-subscribe-stripe");

    expect(billingLink.getAttribute("href")).toBe(
      "/auth/signin?returnUrl=%2Fadministration%2Fbilling%3Fplan%3Dteam",
    );
    expect(teamScope.getByRole("link", { name: /start team evaluation/i })).toBe(billingLink);
    expect(teamScope.getByRole("link", { name: /sign up for team/i })).toHaveAttribute(
      "href",
      "/signup?utm=test",
    );
  });

  it("does not link marketing CTAs to external Stripe checkout URLs when self-serve is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED", "true");

    render(<MarketingTierPricingSection sectionHeadingId="pricing-heading" sectionTitle="Pricing" signupHref="/signup" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    });

    const stripeSubscribe = screen.getByTestId("pricing-team-subscribe-stripe");

    expect(stripeSubscribe.getAttribute("href") ?? "").not.toContain("stripe.com");
    expect(stripeSubscribe.getAttribute("href") ?? "").toContain("/auth/signin");
  });

  it("hides in-app billing CTA when NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED is off even if pricing JSON has a URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED", "0");

    render(
      <MarketingTierPricingSection sectionHeadingId="pricing-heading" sectionTitle="Pricing" signupHref="/signup" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    });

    expect(screen.queryByTestId("pricing-team-subscribe-stripe")).not.toBeInTheDocument();
  });

  it("prefers sales-led quote as Team primary CTA when preferSalesLedQuoteCta is true", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED", "true");
    const quote = document.createElement("div");
    quote.id = "pricing-quote-request";
    document.body.appendChild(quote);

    render(
      <MarketingTierPricingSection
        sectionHeadingId="pricing-heading"
        sectionTitle="Pricing"
        signupHref="/signup?utm_source=pricing_page"
        preferSalesLedQuoteCta
        quoteSectionDomId="pricing-quote-request"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    });

    const teamCard = screen.getByRole("heading", { name: "Team" }).closest("li");
    if (teamCard === null) {
      throw new Error("expected Team tier list item");
    }

    const teamScope = within(teamCard);
    const scroll = vi.spyOn(quote, "scrollIntoView");
    fireEvent.click(teamScope.getByRole("button", { name: /start team evaluation/i }));
    expect(scroll).toHaveBeenCalled();
    teamScope.getByTestId("pricing-team-subscribe-stripe");

    quote.remove();
  });

  it("renders catalog packages without marketing CTAs when tier id is unknown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          schemaVersion: 1,
          currency: "USD",
          packages: [
            {
              id: "pilot",
              title: "Pilot",
              summary: "Legacy pilot tier",
              workspaceMonthlyUsd: 100,
              seatMonthlyUsd: 10,
              annualFloorUsd: 1200,
            },
          ],
        }),
      }),
    );

    render(
      <MarketingTierPricingSection
        sectionHeadingId="pricing-heading"
        sectionTitle="Pricing"
        signupHref="/signup"
        showSignupCallToAction={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Pilot" })).toBeInTheDocument();
    });

    const pilotCard = screen.getByRole("heading", { name: "Pilot" }).closest("li");
    if (pilotCard === null) {
      throw new Error("expected Pilot tier list item");
    }

    expect(within(pilotCard).queryByRole("button")).not.toBeInTheDocument();
    expect(within(pilotCard).queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the AI usage note when showAiUsageNote is enabled", async () => {
    render(
      <MarketingTierPricingSection
        sectionHeadingId="pricing-heading"
        sectionTitle="Pricing"
        signupHref="/signup"
        showAiUsageNote
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pricing-ai-usage-note")).toBeInTheDocument();
    });
  });
});
