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
    <div data-testid="help-comparison-replay-decision-diagram" aria-label={accessibleName}>
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
  COMPARISON_REPLAY_HELP_DIAGRAM_ACCESSIBLE_NAME,
  COMPARISON_REPLAY_HELP_DIAGRAM_TEXT_ALTERNATIVE,
  COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS,
} from "@/lib/comparison-replay-help-guide-content";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
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
    expect(entry?.releaseApplicability).toContain("V1 GA");
  });

  it("aligns Validate review action label with canonical nav label", () => {
    expect(COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.validateReview.label).toBe(
      `Open ${OPERATOR_NAV_LINK_LABELS.replayReview}`,
    );
    expect(OPERATOR_NAV_LINK_LABELS.replayReview).toBe("Validate review");
  });

  it("renders primary actions, provenance, evidence strip, and collapsed decision diagram", () => {
    if (loaded === null) {
      throw new Error("Expected comparison-replay documentation to load.");
    }

    demoEnv.isDemoStrictNavigationRedirectsActive.mockReturnValue(false);

    render(<HelpComparisonReplayGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("V1 GA");

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
      "/internal/replay",
    );

    expect(screen.getByRole("heading", { name: "When to compare" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "When to replay" })).toBeInTheDocument();
    expect(screen.getByText(/Validate review.*in the workspace/i)).toBeInTheDocument();

    const diagramDetails = screen.getByTestId("help-comparison-replay-decision-diagram-details");
    expect(diagramDetails).not.toHaveAttribute("open");
    expect(screen.getByTestId("help-comparison-replay-decision-diagram-summary")).toHaveTextContent(
      COMPARISON_REPLAY_HELP_DIAGRAM_TEXT_ALTERNATIVE,
    );

    const diagram = screen.getByTestId("help-comparison-replay-decision-diagram");
    expect(diagram).toHaveAttribute("aria-label", COMPARISON_REPLAY_HELP_DIAGRAM_ACCESSIBLE_NAME);
    expect(diagram).toHaveTextContent("Compare two reviews");
    expect(diagram).toHaveTextContent("Replay saved comparison");
    expect(diagram).toHaveTextContent("Replay with verify");
    expect(diagram).toHaveTextContent("Start a new architecture review");
    expect(diagram).toHaveTextContent("saved comparison record");
    expect(diagram).toHaveTextContent("delta narrative");

    const diagramText = diagram.textContent ?? "";

    for (const phrase of BANNED_DIAGRAM_COPY) {
      expect(diagramText, `diagram should not contain "${phrase}"`).not.toContain(phrase);
    }
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
