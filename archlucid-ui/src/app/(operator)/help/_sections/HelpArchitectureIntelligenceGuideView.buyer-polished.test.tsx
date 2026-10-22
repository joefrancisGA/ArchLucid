import { render, screen, within } from "@testing-library/react";
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

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpArchitectureIntelligenceGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureIntelligenceGuideView";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_ORIENTATION_SOURCES,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_ORIENTATION_BOTTOM_TEST_ID,
  ARCHITECTURE_INTELLIGENCE_HELP_PAGE_LEAD,
  ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE_BUYER,
  ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION,
  ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_HELPER,
} from "@/lib/architecture-intelligence-help-guide-content";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_CONTENT_ID,
  ARCHITECTURE_INTELLIGENCE_HELP_SKIP_LINK_LABEL,
  ARCHITECTURE_INTELLIGENCE_HELP_SKIP_TARGET_ID,
} from "@/lib/architecture-intelligence-help-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

describe("HelpArchitectureIntelligenceGuideView buyer-polished shell (EAR)", () => {
  const entry = getProductDocumentationEntry("architecture-intelligence");

  it("renders skip link, buyer subtitle, first-viewport intro, bottom orientation, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-intelligence documentation entry.");
    }

    render(<HelpArchitectureIntelligenceGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: ARCHITECTURE_INTELLIGENCE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_INTELLIGENCE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(ARCHITECTURE_INTELLIGENCE_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-heading-eyebrow")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-intelligence-header-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-intelligence-intro")).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_HELP_PAGE_LEAD,
    );
    expect(screen.getByTestId("help-architecture-intelligence-start-here-helper")).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_HELP_START_HERE_HELPER,
    );
    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-intelligence-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ARCHITECTURE_INTELLIGENCE_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-architecture-intelligence-action-panel");
    const orientationBottom = screen.getByTestId(ARCHITECTURE_INTELLIGENCE_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("help-architecture-intelligence-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId(ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.label })).toHaveLength(2);

    expectWhereToGoNextFollowUpLinks(within(sourcesSection), ARCHITECTURE_INTELLIGENCE_HELP_ORIENTATION_SOURCES, "/");

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
