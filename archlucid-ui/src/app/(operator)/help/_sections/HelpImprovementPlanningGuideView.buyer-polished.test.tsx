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

import { HelpImprovementPlanningGuideView } from "@/app/(operator)/help/_sections/HelpImprovementPlanningGuideView";
import { IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE } from "@/lib/improvement-planning-help-evidence-copy";
import { IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION } from "@/lib/improvement-planning-help-guide-content";
import {
  IMPROVEMENT_PLANNING_HELP_FIRST_VIEWPORT_TEST_ID,
  IMPROVEMENT_PLANNING_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  IMPROVEMENT_PLANNING_HELP_SKIP_LINK_LABEL,
  IMPROVEMENT_PLANNING_HELP_SKIP_TARGET_ID,
} from "@/lib/improvement-planning-help-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpImprovementPlanningGuideView buyer-polished shell (HIM)", () => {
  const entry = getProductDocumentationEntry("improvement-planning");

  it("renders skip link, action panel before orientation, and hides contextual help", () => {
    if (entry === undefined) {
      throw new Error("Expected improvement-planning documentation entry.");
    }

    render(<HelpImprovementPlanningGuideView entry={entry} />);

    const skipLink = screen.getByRole("link", { name: IMPROVEMENT_PLANNING_HELP_SKIP_LINK_LABEL });
    expect(skipLink).toHaveAttribute("href", `#${IMPROVEMENT_PLANNING_HELP_SKIP_TARGET_ID}`);

    expect(screen.queryByTestId("help-improvement-planning-claim-discipline-strip")).toBeNull();
    expect(screen.getByTestId(IMPROVEMENT_PLANNING_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID).textContent).toContain(
      IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("help-topic-print-button")).toBeNull();
    expect(screen.getByRole("link", { name: IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION.href,
    );

    const firstViewport = screen.getByTestId(IMPROVEMENT_PLANNING_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-improvement-planning-action-panel");
    const primaryContent = screen.getByTestId("help-improvement-planning-primary-content");
    const orientation = screen.getByTestId("help-improvement-planning-orientation");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientation);
    expect(actionPanel.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
