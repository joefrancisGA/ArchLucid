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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpArchitectureScorecardGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureScorecardGuideView";
import {
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import { ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION } from "@/lib/architecture-scorecard-help-guide-content";
import {
  ARCHITECTURE_SCORECARD_HELP_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURE_SCORECARD_HELP_PRIMARY_CONTENT_ID,
  ARCHITECTURE_SCORECARD_HELP_SKIP_LINK_LABEL,
  ARCHITECTURE_SCORECARD_HELP_SKIP_TARGET_ID,
} from "@/lib/architecture-scorecard-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpArchitectureScorecardGuideView buyer-polished shell (HER)", () => {
  const entry = getProductDocumentationEntry("architecture-scorecard");

  it("renders skip link, first-viewport action panel, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-scorecard documentation entry.");
    }

    render(<HelpArchitectureScorecardGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: ARCHITECTURE_SCORECARD_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_SCORECARD_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-architecture-scorecard-header-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-architecture-scorecard-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scorecard-roi-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-architecture-scorecard-primary-action")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ARCHITECTURE_SCORECARD_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ARCHITECTURE_SCORECARD_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-architecture-scorecard-action-panel");
    const orientationBottom = screen.getByTestId("help-architecture-scorecard-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-architecture-scorecard-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-architecture-scorecard-start-here-primary-cta")).toHaveAttribute(
      "href",
      ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION.href,
    );

    for (const source of filterWhereToGoNextFollowUpLinks(ARCHITECTURE_SCORECARD_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
