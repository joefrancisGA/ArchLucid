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

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpEvidenceGraphGuideView } from "@/app/(operator)/help/_sections/HelpEvidenceGraphGuideView";
import {
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE,
} from "@/lib/evidence-graph-help-evidence-copy";
import { EVIDENCE_GRAPH_HELP_PRIMARY_ACTION } from "@/lib/evidence-graph-help-guide-content";
import {
  EVIDENCE_GRAPH_HELP_FIRST_VIEWPORT_TEST_ID,
  EVIDENCE_GRAPH_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  EVIDENCE_GRAPH_HELP_SKIP_LINK_LABEL,
  EVIDENCE_GRAPH_HELP_SKIP_TARGET_ID,
} from "@/lib/evidence-graph-help-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpEvidenceGraphGuideView buyer-polished shell (HEV)", () => {
  const entry = getProductDocumentationEntry("evidence-graph");

  it("renders skip link, action panel before orientation, and hides contextual help", () => {
    if (entry === undefined) {
      throw new Error("Expected evidence-graph documentation entry.");
    }

    render(<HelpEvidenceGraphGuideView entry={entry} />);

    const skipLink = screen.getByRole("link", { name: EVIDENCE_GRAPH_HELP_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${EVIDENCE_GRAPH_HELP_SKIP_TARGET_ID}`);

    expect(screen.queryByTestId("help-evidence-graph-claim-discipline-strip")).toBeNull();
    expect(screen.getByTestId(EVIDENCE_GRAPH_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID).textContent).toContain(
      EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("help-topic-print-button")).toBeNull();
    expect(screen.getByRole("link", { name: EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.href,
    );

    const firstViewport = screen.getByTestId(EVIDENCE_GRAPH_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-evidence-graph-action-panel");
    const primaryContent = screen.getByTestId("help-evidence-graph-primary-content");
    const orientation = screen.getByTestId("help-evidence-graph-orientation");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientation);
    expect(actionPanel.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
