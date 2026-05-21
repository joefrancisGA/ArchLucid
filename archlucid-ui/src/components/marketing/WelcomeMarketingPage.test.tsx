import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import { WELCOME_HERO_PITCH, WELCOME_WORKFLOW_STEPS } from "@/components/marketing/welcome-marketing-copy";

import { WelcomeMarketingPage } from "./WelcomeMarketingPage";

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
    render(<WelcomeMarketingPage />);

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
    expect(screen.getByTestId("welcome-use-case-azure-waf")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-policy-pack-disclaimer")).toHaveTextContent(/thematic mapping/i);
    expect(screen.getByRole("heading", { name: /Proof at a glance/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Three pillars/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /AI-native architecture analysis/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Pilot" })).toBeInTheDocument();
    });
  });

  it("hero stack: subheading, primary before secondary, correct hrefs, tertiary, FAQ cross-links", () => {
    render(<WelcomeMarketingPage />);

    expect(screen.getByTestId("welcome-hero-cta-subheading")).toHaveTextContent(
      /architecture review package built for governance/i,
    );

    const primaryRow = screen.getByTestId("welcome-hero-primary-secondary-row");
    const rowLinks = within(primaryRow).getAllByRole("link");

    expect(rowLinks[0]).toHaveAttribute("data-testid", "welcome-request-walkthrough-cta");
    expect(rowLinks[0].getAttribute("href")).toMatch(/^mailto:/);

    expect(rowLinks[1]).toHaveAttribute("data-testid", "welcome-self-demo-cta");
    expect(rowLinks[1].getAttribute("href")).toContain("b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf");

    const walkthroughAnchor = screen.getByTestId("welcome-request-walkthrough-cta");
    const selfDemoAnchor = screen.getByTestId("welcome-self-demo-cta");
    const earlyAccessControl = screen.getByRole("button", { name: /join early access/i });

    expect(walkthroughAnchor.compareDocumentPosition(selfDemoAnchor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(selfDemoAnchor.compareDocumentPosition(earlyAccessControl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByRole("link", { name: /bulk upload limit \(30 files\)/i })).toHaveAttribute(
      "href",
      "/faq#bulk-upload-30-files",
    );
    expect(screen.getByRole("link", { name: /^demo workspaces$/i })).toHaveAttribute("href", "/faq#demo-workspaces");
  });
});
