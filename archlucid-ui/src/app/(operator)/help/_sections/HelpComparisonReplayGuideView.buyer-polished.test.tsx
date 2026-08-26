import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: () => <div data-testid="help-comparison-replay-decision-diagram-mermaid" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpComparisonReplayGuideView } from "@/app/(operator)/help/_sections/HelpComparisonReplayGuideView";
import {
  COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/comparison-replay-help-evidence-copy";
import {
  COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS,
} from "@/lib/comparison-replay-help-guide-content";
import {
  COMPARISON_REPLAY_HELP_PRIMARY_CONTENT_ID,
  COMPARISON_REPLAY_HELP_SKIP_LINK_LABEL,
} from "@/lib/comparison-replay-help-page-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpComparisonReplayGuideView buyer-polished shell", () => {
  const loaded = tryLoadProductDocumentation("comparison-replay");

  it("renders skip link, breadcrumb, and claim orientation above body", () => {
    if (loaded === null) {
      throw new Error("Expected comparison-replay documentation to load.");
    }

    render(<HelpComparisonReplayGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const skipLink = screen.getByRole("link", { name: COMPARISON_REPLAY_HELP_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${COMPARISON_REPLAY_HELP_PRIMARY_CONTENT_ID}`);

    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("comparison-replay-help-sources")).toBeInTheDocument();

    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("help-topic-print-button")).toBeNull();
    expect(screen.getByTestId("help-comparison-replay-compare-action")).toBeInTheDocument();
    expect(screen.getByTestId("help-comparison-replay-compare-action")).toHaveAttribute(
      "href",
      COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.compareTwoReviews.href,
    );

    const primaryContent = screen.getByTestId("help-comparison-replay-primary-content");
    const body = screen.getByTestId("help-comparison-replay-primary");
    const orientation = screen.getByTestId("comparison-replay-help-orientation");

    expect(primaryContent).toContainElement(orientation);
    expect(orientation.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
