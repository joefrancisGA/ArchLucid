import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

import { HelpRepeatReviewLoopGuideView } from "@/app/(operator)/help/_sections/HelpRepeatReviewLoopGuideView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SOURCE,
  REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE,
} from "@/lib/repeat-review-loop-help-guide-content";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

const REPEAT_REVIEW_LOOP_SOURCE = "docs/library/REPEAT_REVIEW_LOOP.md";

/** TB-1396 — contributor / CLI / eng-doc leakage must not appear in `/help/repeat-review-loop`. */
const REPEAT_REVIEW_LOOP_HELP_BANNED_SUBSTRINGS = [
  "collect-first-pilot-proof",
  "API_CONTRACTS.md",
  "CORE_PILOT.md",
  "PRODUCT_LEARNING",
  "PRODUCT_PACKAGING.md",
  "fixtures/second-review",
  "SECOND_REVIEW_HABIT_LOOP_VALIDATION",
  "THREE_REAL_MODE_PROOF_RUNS",
  "GENERIC_AI_BAKEOFF_PROTOCOL",
  "Last reviewed",
  "TB-227",
  "stickiness",
  "V1 surface",
  "demo-derived",
  "manifest retrieval",
] as const;

describe("HelpTopicRepeatReviewLoop (TB-1396)", () => {
  const loaded = tryLoadProductDocumentation("repeat-review-loop");

  it("loads REPEAT_REVIEW_LOOP.md from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("purges contributor CLI and eng-doc leakage from prepared and rendered repeat-review help (TB-1396)", () => {
    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(
      loaded.markdown,
      REPEAT_REVIEW_LOOP_SOURCE,
    ).toLowerCase();

    for (const banned of REPEAT_REVIEW_LOOP_HELP_BANNED_SUBSTRINGS) {
      expect(preparedMarkdown, `prepared markdown contains "${banned}"`).not.toContain(
        banned.toLowerCase(),
      );
    }

    render(<HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    for (const banned of REPEAT_REVIEW_LOOP_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `rendered copy contains "${banned}"`).not.toContain(banned.toLowerCase());
    }

    expect(visible).not.toContain("[ ]");

    expect(visible).not.toMatch(/\bTB-\d+\b/i);
  });

  it("keeps buyer-safe loop guidance and in-app help links (TB-1396)", () => {
    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    render(<HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getAllByRole("link", { name: /Compare and replay/i })[0]).toHaveAttribute(
      "href",
      "/help/comparison-replay",
    );
    expect(screen.getAllByRole("link", { name: /Your first architecture review/i })[0]).toHaveAttribute(
      "href",
      "/help/first-architecture-review",
    );
    expect(screen.getByRole("heading", { name: /Recommended loop/i })).toBeInTheDocument();
    expect(screen.queryByText(/collect-first-pilot-proof/i)).toBeNull();
  });

  it("hoists eligibility and start-loop CTA above claim discipline (TB-1394)", () => {
    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    render(<HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const eligibility = screen.getByTestId("help-repeat-review-loop-eligibility");
    const actionPanel = screen.getByTestId("help-repeat-review-loop-action-panel");
    const claimDiscipline = screen.getByTestId("repeat-review-loop-help-claim-discipline");

    expect(within(actionPanel).getByRole("link", { name: /Compare two reviews/i })).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews",
    );
    expect(eligibility.compareDocumentPosition(actionPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(actionPanel.compareDocumentPosition(claimDiscipline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("repeat-review-loop-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-repeat-review-loop-breadcrumb")).toHaveTextContent("Help");
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.queryByTestId("help-repeat-review-loop-refresh-button")).toBeNull();
    expect(screen.getAllByText(/Prerequisite:/i)).toHaveLength(1);
    expect(screen.queryByRole("link", { name: /Validate review/i })).toBeNull();
  });

  it("limits Related help to three buyer-safe guides without accelerator chooser (TB-1397)", () => {
    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    render(<HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const relatedLinks = within(screen.getByTestId("help-repeat-review-loop-related-help")).getAllByRole("link");

    expect(relatedLinks).toHaveLength(3);
    expect(relatedLinks.map((link) => link.getAttribute("href"))).toEqual(
      expect.arrayContaining([
        "/help/comparison-replay",
        "/help/review-packages",
        "/help/first-architecture-review",
      ]),
    );
    expect(relatedLinks.some((link) => (link.getAttribute("href") ?? "").includes("accelerator-chooser"))).toBe(
      false,
    );
  });

  it("uses buyer title honesty without stickiness jargon in the hero (TB-1395)", () => {
    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    render(<HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-repeat-review-loop-page-title")).toHaveTextContent(
      REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE,
    );
    expect(screen.getByRole("heading", { level: 1, name: REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect((document.body.textContent ?? "").toLowerCase()).not.toContain("stickiness");
  });

  it("shows repeat-review cycle diagram in the default viewport without expanding disclosures", () => {
    if (loaded === null) {
      throw new Error("Expected repeat-review-loop documentation to load.");
    }

    render(<HelpRepeatReviewLoopGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const diagramHost = screen.getByTestId("help-repeat-review-loop-cycle-diagram");
    const mermaid = within(diagramHost).getByTestId("mermaid-diagram");

    expect(mermaid).toHaveTextContent("First finalize");
    expect(mermaid).toHaveTextContent("Compare two reviews");
    expect(mermaid).toHaveTextContent("Replay regressions");
    expect(mermaid).toHaveTextContent("Governance dry-run");
    expect(mermaid).toHaveTextContent("Second finalize");
    expect(mermaid).toHaveTextContent("Collect sponsor-safe proof");
    expect(mermaid).toHaveTextContent("Next cycle");

    const diagramText = mermaid.textContent ?? "";

    expect(diagramText).not.toContain("collect-first-pilot-proof");
    expect(diagramText).not.toContain("API_CONTRACTS");
    expect(REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SOURCE).toContain("flowchart LR");
  });
});
