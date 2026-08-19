import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({
    source,
    accessibleName,
  }: {
    readonly source: string;
    readonly accessibleName: string;
  }) => (
    <div data-testid="help-comparison-replay-decision-diagram-mermaid" aria-label={accessibleName}>
      {source}
    </div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpComparisonReplayGuideView } from "@/app/(operator)/help/_sections/HelpComparisonReplayGuideView";
import {
  COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE,
  COMPARISON_REPLAY_HELP_SOURCES,
} from "@/lib/comparison-replay-help-evidence-copy";
import {
  COMPARISON_REPLAY_HELP_IA_DUAL_INBOUND_LABEL,
  COMPARISON_REPLAY_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/compare-repeat-review-help-ia-dual";
import {
  COMPARISON_REPLAY_HELP_DECISION_COMPARE,
  COMPARISON_REPLAY_HELP_DECISION_PANEL_TEST_ID,
  COMPARISON_REPLAY_HELP_DECISION_VALIDATE,
  COMPARISON_REPLAY_HELP_DIAGRAM_ACCESSIBLE_NAME,
  COMPARISON_REPLAY_HELP_DIAGRAM_TEXT_ALTERNATIVE,
  COMPARISON_REPLAY_HELP_FIRST_VIEWPORT_TEST_ID,
  COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS,
} from "@/lib/comparison-replay-help-guide-content";
import {
  COMPARISON_REPLAY_HELP_RELATED_GUIDES,
  COMPARISON_REPLAY_HELP_RELATED_TEST_ID,
} from "@/lib/comparison-replay-help-related-guides";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE } from "@/lib/repeat-review-loop-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const demoEnv = vi.hoisted(() => ({
  isDemoStrictNavigationRedirectsActive: vi.fn(() => false),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isDemoStrictNavigationRedirectsActive: () => demoEnv.isDemoStrictNavigationRedirectsActive(),
  };
});

const BANNED_DIAGRAM_COPY = [
  "/v1/",
  "POST /",
  "GET /",
  "runId",
  "ComparisonRecord",
  "end-to-end-replay",
  "PayloadJson",
] as const;

describe("HelpTopicComparisonReplay (CO)", () => {
  const loaded = tryLoadProductDocumentation("comparison-replay");
  const entry = getProductDocumentationEntry("comparison-replay");

  it("loads comparison-replay help from customer guide source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Compare and replay");
    expect(loaded?.entry.sourcePaths).toContain(
      "docs/library/customer-facing/COMPARISON_REPLAY_OPERATOR_GUIDE.md",
    );
  });

  it("declares registry provenance metadata", () => {
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toBeTruthy();
  });

  it("aligns Validate review action label with canonical nav label", () => {
    expect(COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.validateReview.label).toBe(
      `Open ${OPERATOR_NAV_LINK_LABELS.replayReview}`,
    );
    expect(OPERATOR_NAV_LINK_LABELS.replayReview).toBe("Validate review");
  });

  it("forces compare vs replay job chrome above deferred markdown detail (TB-1639)", () => {
    if (loaded === null) {
      throw new Error("Expected comparison-replay documentation to load.");
    }

    demoEnv.isDemoStrictNavigationRedirectsActive.mockReturnValue(false);

    render(<HelpComparisonReplayGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const firstViewport = screen.getByTestId(COMPARISON_REPLAY_HELP_FIRST_VIEWPORT_TEST_ID);

    expect(within(firstViewport).getByTestId(COMPARISON_REPLAY_HELP_DECISION_PANEL_TEST_ID)).toBeInTheDocument();
    expect(
      within(firstViewport).getByRole("heading", { name: COMPARISON_REPLAY_HELP_DECISION_COMPARE.title }),
    ).toBeInTheDocument();
    expect(
      within(firstViewport).getByRole("heading", { name: COMPARISON_REPLAY_HELP_DECISION_VALIDATE.title }),
    ).toBeInTheDocument();
    expect(within(firstViewport).getByTestId("help-comparison-replay-decision-diagram-panel")).toBeInTheDocument();

    const decisionPanel = screen.getByTestId(COMPARISON_REPLAY_HELP_DECISION_PANEL_TEST_ID);
    const whenToCompare = screen.getByRole("heading", { name: "When to compare" });

    expect(decisionPanel.compareDocumentPosition(whenToCompare) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const jobMatrix = screen.getByTestId(COMPARISON_REPLAY_HELP_JOB_MATRIX_TEST_ID);

    expect(decisionPanel.compareDocumentPosition(jobMatrix) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders primary actions, provenance, evidence strip, and visible decision diagram", () => {
    if (loaded === null) {
      throw new Error("Expected comparison-replay documentation to load.");
    }

    demoEnv.isDemoStrictNavigationRedirectsActive.mockReturnValue(false);

    render(<HelpComparisonReplayGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-09");

    expect(screen.getByTestId("comparison-replay-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("comparison-replay-help-claim-discipline")).toHaveTextContent(
      COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE,
    );

    const sources = screen.getByTestId("comparison-replay-help-sources");

    for (const source of COMPARISON_REPLAY_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.getByRole("link", { name: COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.compareTwoReviews.label })).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews",
    );
    expect(screen.getByRole("link", { name: COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.validateReview.label })).toHaveAttribute(
      "href",
      "/internal/validate-route",
    );

    expect(screen.getByRole("heading", { name: "When to compare" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "When to replay" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "When to use this guide" })).toBeInTheDocument();
    expect(screen.getByTestId(COMPARISON_REPLAY_HELP_JOB_MATRIX_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-comparison-replay-job-matrix-current")).toHaveTextContent(
      "This Compare and replay guide",
    );
    const repeatReviewCrossLinks = screen.getAllByRole("link", { name: REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE });
    expect(repeatReviewCrossLinks).toHaveLength(1);
    expect(repeatReviewCrossLinks[0]).toHaveAttribute("href", "/help/repeat-review-loop");
    expect(screen.getByText(/Validate review.*in the workspace/i)).toBeInTheDocument();

    expect(screen.getByTestId("help-comparison-replay-decision-diagram-panel")).toBeInTheDocument();
    expect(screen.getByTestId("help-comparison-replay-decision-diagram-summary")).toHaveTextContent(
      COMPARISON_REPLAY_HELP_DIAGRAM_TEXT_ALTERNATIVE,
    );

    const primaryContent = screen.getByTestId("help-comparison-replay-primary-content");
    const body = screen.getByTestId("help-comparison-replay-primary");
    const orientation = screen.getByTestId("comparison-replay-help-orientation");

    expect(primaryContent).toContainElement(orientation);
    expect(orientation.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const mermaid = screen.getByTestId("help-comparison-replay-decision-diagram-mermaid");
    expect(mermaid).toHaveAttribute("aria-label", COMPARISON_REPLAY_HELP_DIAGRAM_ACCESSIBLE_NAME);
    expect(mermaid).toHaveTextContent("Compare two reviews");
    expect(mermaid).toHaveTextContent("Replay saved comparison");
    expect(mermaid).toHaveTextContent("Replay with verify");
    expect(mermaid).toHaveTextContent("Start a new architecture review");
    expect(mermaid).toHaveTextContent("saved comparison record");
    expect(mermaid).toHaveTextContent("delta narrative");

    const diagramText = mermaid.textContent ?? "";

    for (const phrase of BANNED_DIAGRAM_COPY) {
      expect(diagramText, `diagram should not contain "${phrase}"`).not.toContain(phrase);
    }
  });

  it("renders curated Related help without markdown workspace hub duplication (TB-1640)", () => {
    if (loaded === null) {
      throw new Error("Expected comparison-replay documentation to load.");
    }

    render(<HelpComparisonReplayGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const relatedLinks = within(screen.getByTestId(COMPARISON_REPLAY_HELP_RELATED_TEST_ID)).getAllByRole("link");

    expect(relatedLinks).toHaveLength(COMPARISON_REPLAY_HELP_RELATED_GUIDES.length);
    expect(relatedLinks.map((link) => link.getAttribute("href"))).toEqual(
      COMPARISON_REPLAY_HELP_RELATED_GUIDES.map((guide) => guide.href),
    );
    expect(screen.queryByRole("heading", { name: "Related guides" })).toBeNull();
  });

  it("discloses Validate review unavailable copy in demo workspace mode", () => {
    if (loaded === null) {
      throw new Error("Expected comparison-replay documentation to load.");
    }

    demoEnv.isDemoStrictNavigationRedirectsActive.mockReturnValue(true);

    render(<HelpComparisonReplayGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.queryByRole("link", { name: COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.validateReview.label })).toBeNull();
    expect(screen.getByTestId("comparison-replay-validate-unavailable")).toHaveTextContent(
      "Validate review is not available in this workspace mode",
    );
    expect(screen.getByTestId("comparison-replay-validate-unavailable")).toHaveTextContent(
      "Check whether stored review output for a finalized package still validates.",
    );
    expect(screen.getByRole("link", { name: COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.compareTwoReviews.label })).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews",
    );
  });
});
