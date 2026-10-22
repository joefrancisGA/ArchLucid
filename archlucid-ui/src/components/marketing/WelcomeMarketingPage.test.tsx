import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/marketing/welcome-marketing-deferred-chunks", async () => {
  const { MarketingTierPricingSection } = await import("./MarketingTierPricingSection");

  return {
    MarketingTierPricingSectionDeferred: MarketingTierPricingSection,
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

import {
  WELCOME_HERO_DIFFERENTIATORS,
  WELCOME_HERO_PITCH,
  WELCOME_PAGE_METADATA_TITLE,
  WELCOME_PRIMARY_CONVERSION_PATH,
  WELCOME_SEE_IT_CTA_LABEL,
  WELCOME_SEE_IT_HREF,
  WELCOME_WORKFLOW_STEPS,
} from "@/components/marketing/welcome-marketing-copy";

import type { PricingDoc } from "@/lib/pricing-types";

import { WelcomeMarketingEngagementPathsSection } from "./WelcomeMarketingEngagementPathsSection";
import { WelcomeMarketingProofAtGlanceSection } from "./WelcomeMarketingProofAtGlanceSection";
import { WelcomeMarketingPage } from "./WelcomeMarketingPage";

const WELCOME_TEST_INITIAL_PRICING: PricingDoc = {
  schemaVersion: 1,
  effectiveDate: "2026-01-01",
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
};

function renderWelcomePage() {
  return render(
    <WelcomeMarketingPage
      initialPricing={WELCOME_TEST_INITIAL_PRICING}
      serverStaticSections={
        <>
          <WelcomeMarketingProofAtGlanceSection />
          <WelcomeMarketingEngagementPathsSection />
        </>
      }
    />,
  );
}

describe("WelcomeMarketingPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders hero, pillars, and pricing cards from fetched JSON", async () => {
    renderWelcomePage();

    expect(screen.getByRole("link", { name: "Skip to welcome content" })).toHaveAttribute(
      "href",
      "#welcome-primary-content",
    );
    expect(screen.getByTestId("welcome-orientation-top")).toBeInTheDocument();
    expect(screen.getAllByTestId("welcome-sources")).toHaveLength(1);

    expect(screen.getByRole("heading", { level: 1, name: /Defensible architecture, on demand/i })).toBeInTheDocument();
    expect(screen.getByTestId("welcome-hero-pitch")).toHaveTextContent(WELCOME_HERO_PITCH);

    const differentiators = screen.getByTestId("welcome-hero-differentiators");

    for (const line of WELCOME_HERO_DIFFERENTIATORS) {
      expect(within(differentiators).getByText(line)).toBeInTheDocument();
    }

    expect(screen.getByTestId("welcome-problem-solution")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-core-workflow")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Core workflow/i })).toBeInTheDocument();

    for (const step of WELCOME_WORKFLOW_STEPS) {
      expect(screen.getByTestId(`welcome-workflow-step-${step.id}`)).toHaveTextContent(step.label);
    }

    expect(screen.getByTestId("welcome-use-cases")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-use-case-ai-governance-security")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-use-case-aws-waf")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-use-case-gcp-architecture-framework")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-use-case-ai-governance-security-cta")).toHaveAttribute(
      "href",
      "/architecture/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b",
    );
    expect(screen.getByTestId("welcome-use-case-aws-waf-cta").getAttribute("href")).toMatch(/\/help\//);
    expect(screen.getByTestId("welcome-use-case-gcp-architecture-framework-cta").getAttribute("href")).toMatch(
      /\/help\//,
    );
    expect(screen.getByTestId("welcome-policy-pack-disclaimer")).toHaveTextContent(/thematic mapping/i);
    expect(screen.getByTestId("welcome-policy-pack-disclaimer")).toHaveTextContent(/Azure Well-Architected and CIS Azure packs/i);
    expect(screen.getByRole("heading", { name: /Proof at a glance/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Three pillars/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /AI-native architecture analysis/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Packaging overview/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pilot" })).toBeInTheDocument();
  });

  it("TB-1294: hero budget — pitch and CTAs stay inside the hero band without differentiator bullets", () => {
    renderWelcomePage();

    const heroBand = screen.getByTestId("welcome-hero-band");
    const heroStack = screen.getByTestId("welcome-hero-cta-stack");

    expect(within(heroBand).queryByTestId("welcome-hero-differentiators")).not.toBeInTheDocument();
    expect(within(heroStack).queryByTestId("welcome-hero-cta-subheading")).not.toBeInTheDocument();
    expect(within(heroStack).queryByTestId("welcome-hero-evaluation-reassurance")).not.toBeInTheDocument();
    expect(within(heroStack).queryByTestId("welcome-hero-tertiary-region")).not.toBeInTheDocument();
    expect(within(heroStack).queryByTestId("welcome-hero-secondary-actions")).not.toBeInTheDocument();
    expect(within(heroStack).queryByRole("button", { name: /join early access/i })).not.toBeInTheDocument();
  });

  it("TB-1295: single primary conversion path in the hero CTA row", () => {
    renderWelcomePage();

    expect(WELCOME_PRIMARY_CONVERSION_PATH).toBe("self-demo");

    const primaryRow = screen.getByTestId("welcome-hero-primary-secondary-row");

    expect(within(primaryRow).getByTestId("welcome-self-demo-cta")).toBeInTheDocument();
    expect(within(primaryRow).getByTestId("welcome-hero-see-it-cta")).toHaveAttribute("href", WELCOME_SEE_IT_HREF);
    expect(within(primaryRow).queryByTestId("welcome-request-walkthrough-cta")).not.toBeInTheDocument();
  });

  it("TB-1294: exports a branded metadata title beyond bare Welcome", () => {
    expect(WELCOME_PAGE_METADATA_TITLE).toContain("ArchLucid");
    expect(WELCOME_PAGE_METADATA_TITLE.toLowerCase()).not.toBe("welcome");
  });

  it("TB-1296: proof ladder lives below the hero with see-it secondary in hero", () => {
    renderWelcomePage();

    const heroBand = screen.getByTestId("welcome-hero-band");
    const proofLadder = screen.getByTestId("welcome-proof-ladder");

    expect(within(heroBand).getByTestId("welcome-hero-see-it-cta")).toHaveAttribute("href", WELCOME_SEE_IT_HREF);
    expect(within(heroBand).queryByTestId("welcome-proof-ladder")).not.toBeInTheDocument();
    expect(within(proofLadder).getByRole("link", { name: WELCOME_SEE_IT_CTA_LABEL })).toHaveAttribute("href", WELCOME_SEE_IT_HREF);
    expect(within(proofLadder).getByRole("link", { name: /illustrative retail roi/i })).toHaveAttribute(
      "href",
      "/WORKED_EXAMPLE_ROI.pdf",
    );
  });

  it("TB-1296/1298: demoted engagement paths + honest see-it copy (no 30-second claim)", () => {
    renderWelcomePage();

    const engagement = screen.getByTestId("welcome-engagement-paths");

    expect(within(engagement).getByTestId("welcome-request-walkthrough-cta")).toBeInTheDocument();
    expect(within(engagement).getByRole("button", { name: /join early access/i })).toBeInTheDocument();
    expect(within(engagement).getByRole("link", { name: /start an evaluation/i })).toHaveAttribute("href", "/signup");
    expect(within(engagement).getByRole("link", { name: /^sign in$/i })).toBeInTheDocument();
    expect(within(engagement).getByRole("link", { name: /ready to start your evaluation/i })).toHaveAttribute(
      "href",
      "/get-started",
    );
    expect(within(engagement).getByRole("link", { name: /illustrative retail roi/i })).toHaveAttribute(
      "href",
      "/WORKED_EXAMPLE_ROI.pdf",
    );

    const pageText = document.body.textContent ?? "";

    expect(pageText.toLowerCase()).not.toMatch(/see it in 30 seconds/);
    expect(pageText.toLowerCase()).not.toMatch(/see it \(30s\)/);
    expect(screen.getAllByRole("link", { name: WELCOME_SEE_IT_CTA_LABEL }).length).toBeGreaterThan(0);
  });

  it("pillar Verify links stay on buyer surfaces without docs/library contributor paths (TB-1297)", () => {
    renderWelcomePage();

    const pillars = screen.getByRole("heading", { name: /Three pillars/i }).closest("section");

    expect(pillars).not.toBeNull();

    const verifyLinks = within(pillars as HTMLElement).getAllByRole("link");
    const hrefs = verifyLinks.map((link) => link.getAttribute("href") ?? "");

    for (const href of hrefs) {
      expect(href.toLowerCase()).not.toContain("docs/library");
      expect(href.toLowerCase()).not.toContain("v1_scope");
      expect(href.toLowerCase()).not.toContain("knowledge_graph");
      expect(href.toLowerCase()).not.toContain("audit_coverage_matrix");
      expect(href.toLowerCase()).not.toContain("pre_commit_governance");
    }

    expect(within(pillars as HTMLElement).getByRole("link", { name: WELCOME_SEE_IT_CTA_LABEL })).toHaveAttribute(
      "href",
      WELCOME_SEE_IT_HREF,
    );
    expect(within(pillars as HTMLElement).getByRole("link", { name: /^Evidence trail$/i })).toHaveAttribute(
      "href",
      "/help/evidence-trail",
    );
    expect(within(pillars as HTMLElement).getByRole("link", { name: /^Trust center$/i })).toHaveAttribute(
      "href",
      "/trust",
    );
    expect(within(pillars as HTMLElement).getByRole("link", { name: /Healthcare Claims sample review/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/\/showcase\//),
    );
  });

  it("renders a hero product visual linking to the see-it proof slice", () => {
    renderWelcomePage();

    expect(screen.getByTestId("welcome-hero-band")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-hero-product-visual")).toHaveAttribute("href", WELCOME_SEE_IT_HREF);
  });
});
