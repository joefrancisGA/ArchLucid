import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { WELCOME_HERO_PITCH, WELCOME_WORKFLOW_STEPS } from "@/components/marketing/welcome-marketing-copy";

import { WelcomeMarketingProofAtGlanceSection } from "./WelcomeMarketingProofAtGlanceSection";
import { WelcomeMarketingPage } from "./WelcomeMarketingPage";

function renderWelcomePage() {
  return render(
    <WelcomeMarketingPage serverStaticSections={<WelcomeMarketingProofAtGlanceSection />} />,
  );
}

describe("WelcomeMarketingPage", () => {
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

  it("renders hero, pillars, and pricing cards from fetched JSON", async () => {
    renderWelcomePage();

    expect(screen.getByRole("heading", { level: 1, name: /Defensible architecture, on demand/i })).toBeInTheDocument();
    expect(screen.getByTestId("welcome-hero-pitch")).toHaveTextContent(WELCOME_HERO_PITCH);
    expect(screen.getByRole("button", { name: /join early access/i })).toBeInTheDocument();
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
      "/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b",
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

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Pilot" })).toBeInTheDocument();
    });
  });

  it("hero stack: subheading, self-serve inspection before optional walkthrough, correct hrefs, tertiary, FAQ cross-links", () => {
    renderWelcomePage();

    expect(screen.getByTestId("welcome-hero-cta-subheading")).toHaveTextContent(
      /architecture review built for governance/i,
    );
    expect(screen.getByTestId("welcome-hero-evaluation-reassurance")).toHaveTextContent(/no sales call required/i);

    const primaryRow = screen.getByTestId("welcome-hero-primary-secondary-row");
    const rowLinks = within(primaryRow).getAllByRole("link");

    expect(rowLinks[0]).toHaveAttribute("data-testid", "welcome-self-demo-cta");
    expect(rowLinks[0].getAttribute("href")).toContain("b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf");

    expect(rowLinks[1]).toHaveAttribute("data-testid", "welcome-request-walkthrough-cta");
    expect(rowLinks[1].getAttribute("href")).toMatch(/^mailto:/);

    const walkthroughAnchor = screen.getByTestId("welcome-request-walkthrough-cta");
    const selfDemoAnchor = screen.getByTestId("welcome-self-demo-cta");
    const earlyAccessControl = screen.getByRole("button", { name: /join early access/i });

    expect(selfDemoAnchor.compareDocumentPosition(walkthroughAnchor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(walkthroughAnchor.compareDocumentPosition(earlyAccessControl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByRole("link", { name: /how many files can i upload\?/i })).toHaveAttribute(
      "href",
      "/faq#how-many-files-upload",
    );
    expect(screen.getByRole("link", { name: /^demo workspaces$/i })).toHaveAttribute("href", "/faq#demo-workspaces");
    expect(screen.getByRole("link", { name: /^product faq$/i })).toHaveAttribute("href", "/faq");
  });
});
