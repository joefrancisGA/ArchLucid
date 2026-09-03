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
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION,
} from "@/lib/architecture-intelligence-help-guide-content";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_CONTENT_ID,
  ARCHITECTURE_INTELLIGENCE_HELP_SKIP_LINK_LABEL,
  ARCHITECTURE_INTELLIGENCE_HELP_SKIP_TARGET_ID,
} from "@/lib/architecture-intelligence-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpArchitectureIntelligenceGuideView buyer-polished shell (EAR)", () => {
  const entry = getProductDocumentationEntry("architecture-intelligence");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-intelligence documentation entry.");
    }

    render(<HelpArchitectureIntelligenceGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: ARCHITECTURE_INTELLIGENCE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_INTELLIGENCE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-architecture-intelligence-header-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-architecture-intelligence-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-intelligence-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ARCHITECTURE_INTELLIGENCE_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-architecture-intelligence-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-architecture-intelligence-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId(ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.label })).toHaveLength(2);

    for (const source of ARCHITECTURE_INTELLIGENCE_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
