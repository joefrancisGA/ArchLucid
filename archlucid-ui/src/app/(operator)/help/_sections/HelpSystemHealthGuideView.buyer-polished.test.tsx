/** @vitest-environment jsdom */
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

import { HelpSystemHealthGuideView } from "@/app/(operator)/help/_sections/HelpSystemHealthGuideView";
import {
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE,
  SYSTEM_HEALTH_HELP_SOURCES,
} from "@/lib/system-health-help-evidence-copy";
import {
  SYSTEM_HEALTH_HELP_PAGE_SUBTITLE,
  SYSTEM_HEALTH_HELP_PAGE_TITLE,
  SYSTEM_HEALTH_HELP_PRIMARY_ACTION,
  SYSTEM_HEALTH_HELP_READINESS_HELPER,
} from "@/lib/system-health-help-guide-content";
import {
  SYSTEM_HEALTH_HELP_FIRST_VIEWPORT_TEST_ID,
  SYSTEM_HEALTH_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SYSTEM_HEALTH_HELP_ORIENTATION_BOTTOM_TEST_ID,
  SYSTEM_HEALTH_HELP_PAGE_LEAD,
  SYSTEM_HEALTH_HELP_PAGE_SUBTITLE_BUYER,
  SYSTEM_HEALTH_HELP_PRIMARY_CONTENT_ID,
  SYSTEM_HEALTH_HELP_SKIP_LINK_LABEL,
  SYSTEM_HEALTH_HELP_SKIP_TARGET_ID,
  SYSTEM_HEALTH_HELP_START_HERE_HELPER,
} from "@/lib/system-health-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSystemHealthGuideView buyer-polished shell (HEY)", () => {
  const entry = getProductDocumentationEntry("system-health");

  it("renders skip link, intro lead, header claim discipline, first-viewport start here, and bottom Sources", () => {
    if (entry === undefined) {
      throw new Error("Expected system-health documentation entry.");
    }

    render(<HelpSystemHealthGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: SYSTEM_HEALTH_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SYSTEM_HEALTH_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(SYSTEM_HEALTH_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SYSTEM_HEALTH_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(SYSTEM_HEALTH_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-system-health-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-system-health-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-system-health-page-title")).toHaveTextContent(SYSTEM_HEALTH_HELP_PAGE_TITLE);

    const primaryContent = screen.getByTestId(SYSTEM_HEALTH_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(SYSTEM_HEALTH_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-system-health-action-panel");
    const overview = screen.getByTestId("help-system-health-overview");
    const orientationBottom = screen.getByTestId(SYSTEM_HEALTH_HELP_ORIENTATION_BOTTOM_TEST_ID);

    expect(primaryContent).toContainElement(firstViewport);
    expect(screen.getByTestId("help-system-health-intro")).toHaveTextContent(SYSTEM_HEALTH_HELP_PAGE_LEAD);
    expect(firstViewport).toContainElement(actionPanel);
    expect(
      within(actionPanel).getByRole("link", { name: SYSTEM_HEALTH_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", SYSTEM_HEALTH_HELP_PRIMARY_ACTION.href);
    expect(within(actionPanel).getByTestId("help-system-health-readiness-helper")).toHaveTextContent(
      SYSTEM_HEALTH_HELP_READINESS_HELPER,
    );
    expect(screen.getByTestId("help-system-health-start-here-helper")).toHaveTextContent(
      SYSTEM_HEALTH_HELP_START_HERE_HELPER,
    );
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const sourcesSection = screen.getByTestId("help-system-health-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(SYSTEM_HEALTH_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
