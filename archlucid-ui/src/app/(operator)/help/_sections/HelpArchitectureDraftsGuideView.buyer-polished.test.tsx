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

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpArchitectureDraftsGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureDraftsGuideView";
import {
  ARCHITECTURE_DRAFTS_HELP_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURE_DRAFTS_HELP_ORIENTATION_BOTTOM_TEST_ID,
  ARCHITECTURE_DRAFTS_HELP_PAGE_LEAD,
  ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE_BUYER,
  ARCHITECTURE_DRAFTS_HELP_PRIMARY_CONTENT_ID,
  ARCHITECTURE_DRAFTS_HELP_SKIP_LINK_LABEL,
  ARCHITECTURE_DRAFTS_HELP_SKIP_TARGET_ID,
  ARCHITECTURE_DRAFTS_HELP_START_HERE_HELPER,
} from "@/lib/architecture-drafts-help-guide-content";
import {
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_DRAFTS_HELP_SOURCES,
} from "@/lib/architecture-drafts-help-evidence-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpArchitectureDraftsGuideView buyer-polished shell (HAR)", () => {
  const entry = getProductDocumentationEntry("architecture-drafts");

  it("renders skip link, buyer subtitle, first-viewport intro, bottom orientation, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-drafts documentation entry.");
    }

    render(<HelpArchitectureDraftsGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: ARCHITECTURE_DRAFTS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_DRAFTS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-heading-eyebrow")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-drafts-header-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-architecture-drafts-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-architecture-drafts-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-architecture-drafts-orientation-top")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-drafts-intro")).toHaveTextContent(ARCHITECTURE_DRAFTS_HELP_PAGE_LEAD);
    expect(screen.getByTestId("help-architecture-drafts-start-here-helper")).toHaveTextContent(
      ARCHITECTURE_DRAFTS_HELP_START_HERE_HELPER,
    );
    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-drafts-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ARCHITECTURE_DRAFTS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ARCHITECTURE_DRAFTS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-architecture-drafts-action-panel");
    const orientationBottom = screen.getByTestId(ARCHITECTURE_DRAFTS_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("help-architecture-drafts-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of ARCHITECTURE_DRAFTS_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
