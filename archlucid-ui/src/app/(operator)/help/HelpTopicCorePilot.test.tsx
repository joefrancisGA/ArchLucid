import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpCorePilotGuideView } from "@/app/(operator)/help/_sections/HelpCorePilotGuideView";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { CORE_PILOT_HELP_SUMMARY_TITLE } from "@/lib/core-pilot-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_INTERNAL_COPY = [
  "core first-session workflow",
  "specialty review templates",
  "ready / warn / hold / deferred / next action",
  "sponsor handoff material",
  "status on home:",
] as const;

describe("HelpCorePilotGuideView", () => {
  const entry = getProductDocumentationEntry("core-pilot");

  it("registers the core pilot guide entry", () => {
    expect(entry?.title).toBe("Your first architecture review");
    expect(entry?.slug).toBe("core-pilot");
  });

  it("renders the guided first-review path near the top", () => {
    if (entry === undefined) {
      throw new Error("Expected core-pilot documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: "Your first architecture review" })).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-summary-card")).toBeInTheDocument();
    const summaryCard = screen.getByTestId("core-pilot-summary-card");
    expect(within(summaryCard).getByText(CORE_PILOT_HELP_SUMMARY_TITLE)).toBeInTheDocument();
    expect(within(summaryCard).getByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toHaveAttribute(
      "href",
      "/reviews/new",
    );
    expect(within(summaryCard).getByRole("link", { name: "Open sample review" })).toBeInTheDocument();
    expect(within(summaryCard).queryByRole("link", { name: "View pilot guide" })).toBeNull();
    expect(screen.getByTestId("core-pilot-primary-start-cta")).toBeInTheDocument();
    // TB-1040: only the hero Start control uses the primary button style.
    expect(screen.getAllByTestId("core-pilot-primary-start-cta")).toHaveLength(1);
  });

  it("does not link recursively to View pilot guide anywhere on the page (TB-1040)", () => {
    if (entry === undefined) {
      throw new Error("Expected core-pilot documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.queryByRole("link", { name: "View pilot guide" })).toBeNull();
    expect(screen.queryByRole("link", { name: /pilot guide/i })).toBeNull();
  });

  it("renders a five-step workflow stepper with action links", () => {
    if (entry === undefined) {
      throw new Error("Expected core-pilot documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const stepper = screen.getByTestId("core-pilot-workflow-stepper");
    expect(within(stepper).getByRole("heading", { name: "Start review" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Add evidence" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Monitor review progress" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Finalize review" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Share outputs" })).toBeInTheDocument();
    expect(within(stepper).getAllByRole("link").length).toBeGreaterThanOrEqual(5);
  });

  it("frames cloud connectors as optional and shows fast-path evidence-only review", () => {
    if (entry === undefined) {
      throw new Error("Expected core-pilot documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(
      screen.getByRole("heading", { name: "Cloud connectors are optional for your first review" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connectors-heading")).toHaveTextContent(/evidence-only review first/i);
    expect(screen.getByRole("heading", { name: "Fast path: evidence-only review" })).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-cloud-actions")).toBeInTheDocument();
  });

  it("uses customer-facing deferral copy and closing CTAs", () => {
    if (entry === undefined) {
      throw new Error("Expected core-pilot documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "What can wait" })).toBeInTheDocument();
    expect(screen.getByText(/compare, replay, and portfolio graph at scale/i)).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-closing-cta")).toBeInTheDocument();
    expect(screen.getByText("The home page shows your next recommended action after each review step.")).toBeInTheDocument();

    const visibleText = document.body.textContent?.toLowerCase() ?? "";

    for (const banned of BANNED_INTERNAL_COPY) {
      expect(visibleText, `should not contain "${banned}"`).not.toContain(banned);
    }
  });

  it("renders sticky on-this-page navigation when enough sections exist", () => {
    if (entry === undefined) {
      throw new Error("Expected core-pilot documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc-heading")).toHaveTextContent("On this page");
    expect(screen.getAllByRole("link", { name: "Run the first review" })[0]).toHaveAttribute(
      "href",
      "#run-the-first-review",
    );
  });
});
