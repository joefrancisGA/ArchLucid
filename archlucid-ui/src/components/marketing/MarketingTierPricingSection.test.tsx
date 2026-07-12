import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPricingDoc,
      }),
    );
  });

  afterEach(() => {
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
    within(architectCard).getByRole("link", { name: /start architect plan/i });
    expect(screen.getByTestId("pricing-tier-price-enterprise")).toHaveTextContent("Custom");
    expect(screen.queryByTestId("pricing-early-adopter-framing")).not.toBeInTheDocument();
  });

  it("sets Team primary CTA to Stripe Checkout when NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED is true", async () => {
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
    const stripeSubscribe = teamScope.getByTestId("pricing-team-subscribe-stripe");

    expect(stripeSubscribe.getAttribute("href")).toBe("https://pay.example.test/checkout");
    expect(stripeSubscribe).toHaveTextContent(/subscribe with stripe/i);
    teamScope.getByRole("link", { name: /start team evaluation/i });
  });

  it("uses NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_URL for Team primary CTA href when flag is true", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_URL", "https://checkout.stripe.com/c/pay/cs_test_override");

    render(<MarketingTierPricingSection sectionHeadingId="pricing-heading" sectionTitle="Pricing" signupHref="/signup" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    });

    const teamCard = screen.getByRole("heading", { name: "Team" }).closest("li");
    if (teamCard === null) {
      throw new Error("expected Team tier list item");
    }

    const stripeSubscribe = within(teamCard).getByTestId("pricing-team-subscribe-stripe");

    expect(stripeSubscribe.getAttribute("href")).toBe("https://checkout.stripe.com/c/pay/cs_test_override");
    expect(stripeSubscribe).toHaveTextContent(/subscribe \(stripe test\)/i);
  });

  it("labels Team primary Stripe CTA as test-only when checkout URL uses cs_test", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockPricingDoc,
          teamStripeCheckoutUrl: "https://checkout.stripe.com/c/pay/cs_test_json",
        }),
      }),
    );

    render(<MarketingTierPricingSection sectionHeadingId="pricing-heading" sectionTitle="Pricing" signupHref="/signup" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    });

    const stripeSubscribe = screen.getByTestId("pricing-team-subscribe-stripe");

    expect(stripeSubscribe.getAttribute("href")).toBe("https://checkout.stripe.com/c/pay/cs_test_json");
    expect(stripeSubscribe).toHaveTextContent(/subscribe \(stripe test\)/i);
  });

  it("labels Team primary Stripe CTA as test-only for buy.stripe.com test payment links", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockPricingDoc,
          teamStripeCheckoutUrl: "https://buy.stripe.com/test_some_link",
        }),
      }),
    );

    render(<MarketingTierPricingSection sectionHeadingId="pricing-heading" sectionTitle="Pricing" signupHref="/signup" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    });

    const stripeSubscribe = screen.getByTestId("pricing-team-subscribe-stripe");

    expect(stripeSubscribe.getAttribute("href")).toBe("https://buy.stripe.com/test_some_link");
    expect(stripeSubscribe).toHaveTextContent(/subscribe \(stripe test\)/i);
  });

  it("does not add test-only labeling for cs_live checkout URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockPricingDoc,
          teamStripeCheckoutUrl: "https://checkout.stripe.com/c/pay/cs_live_abc",
        }),
      }),
    );

    render(<MarketingTierPricingSection sectionHeadingId="pricing-heading" sectionTitle="Pricing" signupHref="/signup" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    });

    const stripeSubscribe = screen.getByTestId("pricing-team-subscribe-stripe");

    expect(stripeSubscribe).toHaveTextContent(/subscribe with stripe/i);
    expect(stripeSubscribe.textContent?.toLowerCase() ?? "").not.toContain("stripe test");
  });

  it("hides Subscribe with Stripe when the configured URL is a placeholder", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockPricingDoc,
          teamStripeCheckoutUrl: "https://checkout.stripe.com/placeholder-replace-before-launch",
          architectStripeCheckoutUrl: "https://checkout.stripe.com/placeholder-replace-before-launch",
        }),
      }),
    );

    vi.stubEnv("NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED", "true");

    render(
      <MarketingTierPricingSection sectionHeadingId="pricing-heading" sectionTitle="Pricing" signupHref="/signup" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
    });

    expect(screen.queryByTestId("pricing-team-subscribe-stripe")).not.toBeInTheDocument();
  });

  it("hides Subscribe with Stripe when NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED is off even if pricing JSON has a URL", async () => {
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
