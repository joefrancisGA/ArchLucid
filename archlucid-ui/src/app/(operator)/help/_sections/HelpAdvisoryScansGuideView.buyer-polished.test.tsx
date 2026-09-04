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

import { HelpAdvisoryScansGuideView } from "@/app/(operator)/help/_sections/HelpAdvisoryScansGuideView";
import {
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE,
  ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE,
  ADVISORY_SCANS_HELP_SOURCES,
} from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_HELP_PRIMARY_ACTION } from "@/lib/advisory-scans-help-guide-content";
import {
  ADVISORY_SCANS_HELP_FIRST_VIEWPORT_TEST_ID,
  ADVISORY_SCANS_HELP_PRIMARY_CONTENT_ID,
  ADVISORY_SCANS_HELP_SKIP_LINK_LABEL,
  ADVISORY_SCANS_HELP_SKIP_TARGET_ID,
} from "@/lib/advisory-scans-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAdvisoryScansGuideView buyer-polished shell (HAD)", () => {
  const entry = getProductDocumentationEntry("advisory-scans");

  it("renders skip link, first-viewport action panel, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected advisory-scans documentation entry.");
    }

    render(<HelpAdvisoryScansGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: ADVISORY_SCANS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ADVISORY_SCANS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-advisory-scans-header-claim-discipline")).toHaveTextContent(
      ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-advisory-scans-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc-mobile")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-advisory-scans-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ADVISORY_SCANS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ADVISORY_SCANS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-advisory-scans-action-panel");
    const orientationBottom = screen.getByTestId("help-advisory-scans-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-advisory-scans-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-advisory-scans-start-here-primary-cta")).toHaveAttribute(
      "href",
      ADVISORY_SCANS_HELP_PRIMARY_ACTION.href,
    );

    for (const source of filterWhereToGoNextFollowUpLinks(ADVISORY_SCANS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
