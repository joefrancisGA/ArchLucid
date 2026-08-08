import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => ({
    isPending: false,
    data: {
      hasCommittedManifest: false,
      committedReviewCount: 0,
      latestRunId: null,
      firstCommittedRunId: null,
      secondCommittedRunId: null,
      latestRunReadyToFinalize: false,
    },
  }),
}));

import { HelpCorePilotGuideView } from "@/app/(operator)/help/_sections/HelpCorePilotGuideView";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { CORE_PILOT_HELP_CLAIM_DISCIPLINE } from "@/lib/core-pilot-help-evidence-copy";
import {
  CORE_PILOT_HELP_DISCLOSURE,
  CORE_PILOT_HELP_SUMMARY_TITLE,
} from "@/lib/core-pilot-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_INTERNAL_COPY = [
  "core first-session workflow",
  "specialty review templates",
  "ready / warn / hold / deferred / next action",
  "sponsor handoff material",
  "status on home:",
] as const;

describe("HelpCorePilotGuideView", () => {
  const entry = getProductDocumentationEntry("first-architecture-review");

  it("registers the core pilot guide entry", () => {
    expect(entry?.title).toBe("Your first architecture review");
    expect(entry?.slug).toBe("first-architecture-review");
    expect(entry?.summary).toMatch(/guided path from evidence intake/i);
    expect(entry?.summary).not.toMatch(/core[- ]?pilot/i);
  });

  it("renders buyer title and subtitle without Core-pilot jargon (TB-1041)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: "Your first architecture review" })).toBeInTheDocument();
    expect(screen.getByText(entry.summary)).toBeInTheDocument();
    expect(screen.queryByText(/core[- ]?pilot/i)).toBeNull();
  });

  it("renders the guided first-review path near the top", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: "Your first architecture review" })).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-summary-card")).toBeInTheDocument();
    const summaryCard = screen.getByTestId("core-pilot-summary-card");
    expect(within(summaryCard).getByText(CORE_PILOT_HELP_SUMMARY_TITLE)).toBeInTheDocument();
    expect(within(summaryCard).getByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(within(summaryCard).getByRole("link", { name: "Open sample review" })).toBeInTheDocument();
    expect(within(summaryCard).queryByRole("link", { name: "View pilot guide" })).toBeNull();
    expect(screen.getByTestId("core-pilot-primary-start-cta")).toBeInTheDocument();
    // TB-1040: only the hero Start control uses the primary button style.
    expect(screen.getAllByTestId("core-pilot-primary-start-cta")).toHaveLength(1);
  });

  it("does not link recursively to View pilot guide in the hero path (TB-1040)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    // TB-1043 later added a legitimate cross-link to the distinct "Pilot guide" topic in
    // core-pilot-related-guides — only the exact self-referential "View pilot guide" label is banned.
    expect(screen.queryByRole("link", { name: "View pilot guide" })).toBeNull();
    expect(within(screen.getByTestId("core-pilot-summary-card")).queryByRole("link", { name: /pilot guide/i })).toBeNull();
  });

  it("renders a five-step workflow stepper with action links", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const stepper = screen.getByTestId("core-pilot-workflow-stepper");
    expect(within(stepper).getByRole("heading", { name: "Start review" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Add evidence" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Monitor review progress" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Finalize review" })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: "Share outputs" })).toBeInTheDocument();
    expect(within(stepper).getAllByRole("link").length).toBeGreaterThanOrEqual(3);
  });

  it("collapses the steps 3–5 gate into one control when no active run (TB-1042)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const stepper = screen.getByTestId("core-pilot-workflow-stepper");
    const gatedLinks = within(stepper).getAllByRole("link", { name: "Start a review first" });

    expect(gatedLinks).toHaveLength(1);
    expect(gatedLinks[0]).toHaveAttribute("href", "/architecture/reviews/new");
    expect(gatedLinks[0].getAttribute("href")).not.toContain("projectId=default");

    const gateNote = screen.getByTestId("core-pilot-workflow-gate-note");
    expect(gateNote).toHaveTextContent(/steps 3, 4 and 5 unlock after your first review starts/i);
    expect(gateNote).toHaveTextContent(/exports unlock after you start a review/i);

    // The per-step duplicates of the same gate are gone.
    expect(screen.queryByTestId("core-pilot-step-3-cta")).toBeNull();
    expect(screen.queryByTestId("core-pilot-step-4-cta")).toBeNull();
    expect(screen.queryByTestId("core-pilot-step-5-cta")).toBeNull();
  });

  it("frames cloud connectors as optional and shows fast-path evidence-only review", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(
      screen.getByRole("heading", { name: "Cloud connectors are optional for your first review" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-cloud-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connectors-heading")).toHaveTextContent(/evidence-only review first/i);
    expect(screen.getByRole("heading", { name: "Fast path: evidence-only review" })).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-fast-path-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-cloud-actions")).toBeInTheDocument();
  });

  it("uses customer-facing deferral copy and closing CTAs", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "What can wait" })).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-what-can-wait-disclosure")).toBeInTheDocument();
    expect(screen.getByText(/compare, replay, and portfolio graph at scale/i)).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-closing-cta")).toBeInTheDocument();
    expect(screen.getByText("The home page shows your next recommended action after each review step.")).toBeInTheDocument();

    const visibleText = document.body.textContent?.toLowerCase() ?? "";

    for (const banned of BANNED_INTERNAL_COPY) {
      expect(visibleText, `should not contain "${banned}"`).not.toContain(banned);
    }
  });

  it("compresses first viewport to hero + stepper and trims related guides (TB-1043)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const firstViewport = screen.getByTestId("core-pilot-first-viewport");
    expect(within(firstViewport).getByTestId("core-pilot-summary-card")).toBeInTheDocument();
    expect(within(firstViewport).getByTestId("core-pilot-workflow-stepper")).toBeInTheDocument();
    expect(within(firstViewport).queryByTestId("core-pilot-cloud-disclosure")).toBeNull();
    expect(within(firstViewport).queryByTestId("core-pilot-related-guides")).toBeNull();

    const related = screen.getByTestId("core-pilot-related-guides");
    expect(within(related).getAllByRole("link")).toHaveLength(5);
    expect(within(related).getByRole("link", { name: "Pilot guide" })).toBeInTheDocument();
    expect(within(related).getByRole("link", { name: "First review guide in the product" })).toBeInTheDocument();
    expect(within(related).getByRole("link", { name: "Troubleshooting" })).toBeInTheDocument();
    expect(within(related).queryByRole("link", { name: "Review templates" })).toBeNull();
    expect(within(related).queryByRole("link", { name: "Evaluator workbook" })).toBeNull();
  });

  it("absorbs follow-up Sources into Related guides instead of a top-of-page strip", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.queryByTestId("core-pilot-help-sources")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Sources for follow-up" })).toBeNull();

    const related = screen.getByTestId("core-pilot-related-guides");
    expect(within(related).getByRole("link", { name: "Getting started" })).toBeInTheDocument();
    expect(within(related).getByRole("link", { name: "Cloud connections" })).toBeInTheDocument();
    // "Start a review" is already a page CTA; it must not reappear as a follow-up link.
    expect(within(related).queryByRole("link", { name: "Start a review" })).toBeNull();
  });

  it("keeps claim discipline verbatim but places it after the guide (not above it)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const orientation = screen.getByTestId("core-pilot-help-orientation");
    expect(within(orientation).getByTestId("core-pilot-help-claim-discipline")).toHaveTextContent(
      CORE_PILOT_HELP_CLAIM_DISCIPLINE,
    );

    const firstViewport = screen.getByTestId("core-pilot-first-viewport");
    expect(within(firstViewport).queryByTestId("core-pilot-help-orientation")).toBeNull();

    const related = screen.getByTestId("core-pilot-related-guides");
    expect(related.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("opens the guide-scope disclosure by default so the lower page is not all collapsed bars", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const scopeSummary = screen.getByText(CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.title);
    const scopeDetails = scopeSummary.closest("details");

    expect(scopeDetails).not.toBeNull();
    expect(scopeDetails?.open).toBe(true);
  });

  it("renders sticky on-this-page navigation when enough sections exist", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
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
