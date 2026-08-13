import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

const mockUseCorePilotCommitContextQuery = vi.fn();

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => mockUseCorePilotCommitContextQuery(),
}));

import { HelpCorePilotGuideView } from "@/app/(operator)/help/_sections/HelpCorePilotGuideView";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  CORE_PILOT_HELP_DISCLOSURE,
  CORE_PILOT_HELP_IN_PRODUCT_CHECKLIST_LABEL,
  CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL,
  CORE_PILOT_HELP_SUMMARY_TITLE,
} from "@/lib/core-pilot-help-guide-content";
import { CORE_PILOT_HELP_CLAIM_DISCIPLINE } from "@/lib/core-pilot-help-evidence-copy";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { firstArchitectureReviewHelpCopyContainsBannedPattern } from "@/lib/first-architecture-review-help-banned-copy";
import {
  CORE_PILOT_HELP_IA_DUAL_HEADING,
  CORE_PILOT_HELP_IA_DUAL_INBOUND_LABEL,
  CORE_PILOT_HELP_JOB_MATRIX_TEST_ID,
  EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_HREF,
  EVIDENCE_ONLY_REVIEW_HELP_IA_DUAL_INBOUND_LABEL,
} from "@/lib/core-pilot-help-ia-dual";
import { CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TEST_ID } from "@/lib/core-pilot-help-guide-content";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help/help-topic-permanent-redirects";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_INTERNAL_COPY = [
  "core first-session workflow",
  "specialty review templates",
  "ready / warn / hold / deferred / next action",
  "sponsor handoff material",
  "status on home:",
] as const;

const emptyCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

function mockCommitQuery(
  overrides: Partial<{
    isPending: boolean;
    isError: boolean;
    data: typeof emptyCommitContext;
  }> = {},
): void {
  mockUseCorePilotCommitContextQuery.mockReturnValue({
    isPending: overrides.isPending ?? false,
    isError: overrides.isError ?? false,
    data: overrides.data ?? emptyCommitContext,
  });
}

describe("HelpCorePilotGuideView", () => {
  const entry = getProductDocumentationEntry("first-architecture-review");

  beforeEach(() => {
    mockCommitQuery();
  });

  it("registers the core pilot guide entry", () => {
    expect(entry?.title).toBe("Your first architecture review");
    expect(entry?.slug).toBe("first-architecture-review");
    expect(entry?.summary).toMatch(/guided path from evidence intake/i);
    expect(entry?.summary).not.toMatch(/core[- ]?pilot/i);
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toMatch(/first architecture review workflow/i);
  });

  it("renders buyer title and subtitle without Core-pilot jargon (TB-1041)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: "Your first architecture review" })).toBeInTheDocument();
    expect(screen.getByText(entry.summary)).toBeInTheDocument();
    expect(screen.queryByText(/core[- ]?pilot/i)).toBeNull();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
  });

  it("renders TB-1379 specialty companion root with primary Start CTA in first viewport", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByTestId("help-core-pilot-guide")).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-primary-start-cta")).toHaveAttribute("href", "/architecture/reviews/new");
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
    expect(within(summaryCard).getByRole("link", { name: CORE_PILOT_HELP_SAMPLE_REVIEW_CTA_LABEL })).toBeInTheDocument();
    expect(within(summaryCard).queryByRole("link", { name: "View pilot guide" })).toBeNull();
    expect(screen.getByTestId("core-pilot-primary-start-cta")).toBeInTheDocument();
    expect(screen.getAllByTestId("core-pilot-primary-start-cta")).toHaveLength(1);
  });

  it("limits /architecture/reviews/new links to buyer start paths (hero, stepper, optional disclosure)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const newReviewLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/architecture/reviews/new");

    expect(newReviewLinks).toHaveLength(6);
    expect(newReviewLinks.map((link) => link.textContent)).toEqual(
      expect.arrayContaining([
        BUYER_START_ARCHITECTURE_REVIEW_CTA,
        "Start a review to add evidence",
        "Start a review first",
        "Start evidence-only review",
      ]),
    );
    expect(
      newReviewLinks.filter((link) => link.textContent === "Start evidence-only review"),
    ).toHaveLength(2);
  });

  it("does not link recursively to View pilot guide in the hero path (TB-1040)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.queryByRole("link", { name: "View pilot guide" })).toBeNull();
    expect(within(screen.getByTestId("core-pilot-summary-card")).queryByRole("link", { name: /pilot guide/i })).toBeNull();
  });

  it("renders a five-step workflow stepper with action links", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const stepper = screen.getByTestId("core-pilot-workflow-stepper");
    expect(within(stepper).getByRole("heading", { name: /Start review/ })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: /Add evidence/ })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: /Monitor review progress/ })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: /Finalize review/ })).toBeInTheDocument();
    expect(within(stepper).getByRole("heading", { name: /Share outputs/ })).toBeInTheDocument();
    expect(within(stepper).getByRole("link", { name: "Start a review to add evidence" })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(within(stepper).getByTestId("core-pilot-step-1-cta")).toHaveAttribute("href", "/architecture/reviews/new");
  });

  it("TB-1381: exposes create, findings, finalize, and export actions when a run is ready", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    mockCommitQuery({
      data: {
        ...emptyCommitContext,
        latestRunId: "run-abc",
        latestRunReadyToFinalize: true,
      },
    });

    render(<HelpCorePilotGuideView entry={entry} />);

    const stepper = screen.getByTestId("core-pilot-workflow-stepper");

    expect(within(stepper).getByTestId("core-pilot-step-1-cta")).toHaveTextContent(BUYER_START_ARCHITECTURE_REVIEW_CTA);
    expect(within(stepper).getByTestId("core-pilot-step-2-cta")).toHaveTextContent("Add evidence on review detail");
    expect(within(stepper).getByTestId("core-pilot-step-3-cta")).toHaveTextContent("Open review detail");
    expect(within(stepper).getByTestId("core-pilot-step-3-findings-link")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc?reviewTab=findings",
    );
    expect(within(stepper).getByTestId("core-pilot-step-3-evidence-trail-link")).toHaveAttribute(
      "href",
      "/help/evidence-trail",
    );
    expect(within(stepper).getByTestId("core-pilot-step-4-cta")).toHaveTextContent("Finalize on review detail");
    expect(within(stepper).getByTestId("core-pilot-step-5-cta")).toHaveTextContent("Open review detail");
  });

  it("TB-1381: opens exports when a finalized review exists", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    mockCommitQuery({
      data: {
        ...emptyCommitContext,
        hasCommittedManifest: true,
        committedReviewCount: 1,
        firstCommittedRunId: "run-done",
        latestRunId: "run-done",
      },
    });

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByTestId("core-pilot-step-5-cta")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-done#artifacts-exports",
    );
    expect(screen.getByTestId("core-pilot-step-5-cta")).toHaveTextContent("Open exports");
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

    expect(screen.queryByTestId("core-pilot-step-3-cta")).toBeNull();
    expect(screen.queryByTestId("core-pilot-step-4-cta")).toBeNull();
    expect(screen.queryByTestId("core-pilot-step-5-cta")).toBeNull();
  });

  it("shows pending placeholders instead of disabled controls while context loads", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    mockCommitQuery({ isPending: true });

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByTestId("core-pilot-step-2-pending")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("core-pilot-step-3-pending")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("core-pilot-step-4-pending")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("core-pilot-step-5-pending")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByTestId("core-pilot-workflow-gate-note")).toBeNull();
    expect(screen.queryByRole("button", { name: "Open review detail" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Finalize on review detail" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Open exports" })).toBeNull();
    expect(screen.queryByTestId("core-pilot-step-2-cta")).toBeNull();
    expect(screen.queryByTestId("core-pilot-step-4-cta")).toBeNull();
  });

  it("falls back to the gate note when context fetch fails", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    mockCommitQuery({ isError: true });

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByTestId("core-pilot-workflow-context-error")).toHaveTextContent(
      /Couldn't check workspace status/i,
    );
    expect(screen.getByTestId("core-pilot-workflow-gate-note")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a review first" })).toHaveAttribute("href", "/architecture/reviews/new");
  });

  it("exposes step ordinals and status tags on each workflow step", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const stepper = screen.getByTestId("core-pilot-workflow-stepper");

    for (let stepNumber = 1; stepNumber <= 5; stepNumber += 1) {
      expect(
        within(stepper).getByRole("heading", { name: new RegExp(`Step ${stepNumber} of 5`) }),
      ).toBeInTheDocument();
      expect(screen.getByTestId(`core-pilot-step-${stepNumber}-status`)).toHaveTextContent("Not started");
    }
  });

  it("labels sections from visible h2 headings", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByRole("region", { name: "Run the first review" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Optional paths for your first review" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Cloud connectors are optional for your first review" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Fast path: evidence-only review" })).toBeNull();
    expect(screen.queryByRole("region", { name: "What can wait" })).toBeNull();
    expect(screen.getByTestId("core-pilot-closing-cta")).toBeInTheDocument();
  });

  it("frames optional cloud and evidence-only paths inside one disclosure (TB-1334)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "Optional paths for your first review" })).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-optional-paths-disclosure")).toBeInTheDocument();
    expect(screen.queryByTestId("core-pilot-cloud-disclosure")).toBeNull();
    expect(screen.queryByTestId("core-pilot-fast-path-disclosure")).toBeNull();
    expect(screen.queryByTestId("core-pilot-what-can-wait-disclosure")).toBeNull();

    const disclosure = screen.getByTestId("core-pilot-optional-paths-disclosure");
    expect(within(disclosure).getByTestId("core-pilot-cloud-actions")).toBeInTheDocument();
    expect(within(disclosure).getByTestId("core-pilot-fast-path-panel")).toBeInTheDocument();
    expect(within(disclosure).getByTestId("core-pilot-deferred-topics-panel")).toBeInTheDocument();
    expect(within(disclosure).getByText(/evidence-only review first/i)).toBeInTheDocument();
  });

  it("TB-1683: first-viewport job matrix links full review vs evidence-only fast path once each", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const firstViewport = screen.getByTestId("core-pilot-first-viewport");
    const jobMatrix = within(firstViewport).getByTestId(CORE_PILOT_HELP_JOB_MATRIX_TEST_ID);

    expect(within(jobMatrix).getByRole("heading", { name: CORE_PILOT_HELP_IA_DUAL_HEADING })).toBeInTheDocument();
    expect(within(jobMatrix).getByText(/This first architecture review guide/i)).toBeInTheDocument();
    expect(
      within(jobMatrix).getByRole("link", { name: EVIDENCE_ONLY_REVIEW_HELP_IA_DUAL_INBOUND_LABEL }),
    ).toHaveAttribute("href", EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_HREF);

    const disclosure = screen.getByTestId("core-pilot-optional-paths-disclosure");
    expect(
      within(disclosure).getByRole("link", { name: CORE_PILOT_HELP_IA_DUAL_INBOUND_LABEL }),
    ).toHaveAttribute("href", `${FIRST_ARCHITECTURE_REVIEW_HELP_PATH}#first-review-path`);
    expect(within(disclosure).getByTestId("core-pilot-fast-path-panel")).toHaveAttribute(
      "id",
      "fast-path-evidence-only-review",
    );
  });

  it("TB-1684: optional cloud cards do not promote extract-upload as the buyer start path", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const firstViewport = screen.getByTestId("core-pilot-first-viewport");
    const extractUploadLinks = within(firstViewport)
      .queryAllByRole("link")
      .filter((link) => link.getAttribute("href")?.includes("/administration/extract-upload"));

    expect(extractUploadLinks).toHaveLength(0);

    const disclosure = screen.getByTestId("core-pilot-optional-paths-disclosure");
    const cloudActions = within(disclosure).getByTestId("core-pilot-cloud-actions");
    const evidenceOnlyCard = within(cloudActions).getByRole("link", { name: "Start evidence-only review" });

    expect(evidenceOnlyCard).toHaveAttribute("href", "/architecture/reviews/new");
    expect(within(disclosure).queryByRole("link", { name: /upload settings/i })).toBeNull();
    expect(
      within(disclosure)
        .queryAllByRole("link")
        .filter((link) => link.getAttribute("href")?.includes("/administration/extract-upload")),
    ).toHaveLength(0);
  });

  it("TB-1685: first-viewport job chrome shows three numbered steps before Related guides", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const firstViewport = screen.getByTestId("core-pilot-first-viewport");
    const jobChrome = within(firstViewport).getByTestId(CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TEST_ID);

    expect(within(jobChrome).getByRole("heading", { name: /Your first review in three steps/i })).toBeInTheDocument();
    expect(within(jobChrome).getByTestId("core-pilot-first-viewport-step-1")).toHaveTextContent(/Start a review/);
    expect(within(jobChrome).getByTestId("core-pilot-first-viewport-step-2")).toHaveTextContent(/Add evidence/);
    expect(within(jobChrome).getByTestId("core-pilot-first-viewport-step-3")).toHaveTextContent(/Finalize and share/);
    expect(within(firstViewport).queryByTestId("core-pilot-related-guides")).toBeNull();
    expect(within(firstViewport).queryByTestId("core-pilot-optional-paths-disclosure")).toBeNull();
    expect(screen.getByTestId("core-pilot-workflow-stepper")).toBeInTheDocument();
  });

  it("uses customer-facing deferral copy and closing CTAs", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "Ready to begin?" })).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-closing-cta")).toBeInTheDocument();
    expect(screen.getByText(/compare, replay, and portfolio graph at scale/i)).toBeInTheDocument();
    expect(
      within(screen.getByTestId("core-pilot-closing-cta")).getByRole("link", { name: "Jump to start control" }),
    ).toHaveAttribute("href", "#first-review-path");

    const visibleText = document.body.textContent?.toLowerCase() ?? "";

    for (const banned of BANNED_INTERNAL_COPY) {
      expect(visibleText, `should not contain "${banned}"`).not.toContain(banned);
    }
  });

  it("TB-1382: trims related guides to three job-matched topics (TB-1043 follow-on)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const firstViewport = screen.getByTestId("core-pilot-first-viewport");
    expect(within(firstViewport).getByTestId("core-pilot-summary-card")).toBeInTheDocument();
    expect(within(firstViewport).getByTestId(CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TEST_ID)).toBeInTheDocument();
    expect(within(firstViewport).queryByTestId("core-pilot-workflow-stepper")).toBeNull();
    expect(within(firstViewport).queryByTestId("core-pilot-optional-paths-disclosure")).toBeNull();
    expect(within(firstViewport).queryByTestId("core-pilot-related-guides")).toBeNull();
    expect(within(firstViewport).queryByTestId("core-pilot-help-orientation")).toBeNull();
    expect(within(firstViewport).queryByTestId("help-topic-registry-provenance")).toBeNull();

    const related = screen.getByTestId("core-pilot-related-guides");
    expect(within(related).getAllByRole("link")).toHaveLength(3);
    expect(within(related).getByRole("link", { name: "Evidence intake" })).toBeInTheDocument();
    expect(within(related).getByRole("link", { name: "Pilot guide" })).toBeInTheDocument();
    expect(within(related).getByRole("link", { name: "Troubleshooting" })).toBeInTheDocument();
    expect(within(related).queryByRole("link", { name: CORE_PILOT_HELP_IN_PRODUCT_CHECKLIST_LABEL })).toBeNull();
    expect(within(related).queryByRole("link", { name: "Getting started" })).toBeNull();
    expect(within(related).queryByRole("link", { name: "First review guide in the product" })).toBeNull();
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
    expect(within(related).getByRole("link", { name: "Evidence intake" })).toBeInTheDocument();
    expect(within(related).getByRole("link", { name: "Pilot guide" })).toBeInTheDocument();
    expect(within(related).queryByRole("link", { name: CORE_PILOT_HELP_IN_PRODUCT_CHECKLIST_LABEL })).toBeNull();
    expect(within(related).queryByRole("link", { name: "Start a review" })).toBeNull();
  });

  it("places claim discipline at the article tail, not the first viewport (TB-2092)", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const orientation = screen.getByTestId("core-pilot-help-orientation");
    const related = screen.getByTestId("core-pilot-related-guides");
    const firstViewport = screen.getByTestId("core-pilot-first-viewport");

    expect(within(firstViewport).queryByTestId("core-pilot-help-orientation")).toBeNull();
    expect(orientation.compareDocumentPosition(related) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(screen.getByTestId("core-pilot-help-claim-discipline")).toHaveTextContent(CORE_PILOT_HELP_CLAIM_DISCIPLINE);
  });

  it("keeps the guide-scope disclosure collapsed by default", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    const scopeSummary = screen.getByText(CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.title);
    const scopeDetails = scopeSummary.closest("details");

    expect(scopeDetails).not.toBeNull();
    expect(scopeDetails?.open).toBe(false);
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

  it("TB-1375: purges Pilot-first and operator-path jargon from rendered customer chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    const { container } = render(<HelpCorePilotGuideView entry={entry} />);
    const visible = container.textContent ?? "";

    expect(firstArchitectureReviewHelpCopyContainsBannedPattern(visible)).toEqual([]);
    expect(visible.toLowerCase()).not.toContain("operator orientation");
    expect(screen.getByRole("heading", { level: 2, name: "Before you share externally" })).toBeInTheDocument();
  });

  it("canonicalizes first-hour-operator-path into specialty first-review chrome (TB-1374)", () => {
    expect(resolveHelpTopicPermanentRedirect("first-hour-operator-path")).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_PATH);
    expect(getProductDocumentationEntry("first-hour-operator-path")).toBeNull();

    if (entry === undefined) {
      throw new Error("Expected first-architecture-review documentation entry.");
    }

    render(<HelpCorePilotGuideView entry={entry} />);

    expect(screen.getByTestId("core-pilot-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-primary-start-cta")).toHaveTextContent(BUYER_START_ARCHITECTURE_REVIEW_CTA);
    expect(screen.queryByTestId("help-topic-print-button")).toBeNull();
  });
});
