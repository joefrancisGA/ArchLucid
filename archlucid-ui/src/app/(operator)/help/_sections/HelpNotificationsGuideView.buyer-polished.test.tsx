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

import { HelpNotificationsGuideView } from "@/app/(operator)/help/_sections/HelpNotificationsGuideView";
import {
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE,
  NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE,
  NOTIFICATIONS_HELP_SOURCES,
} from "@/lib/notifications-help-evidence-copy";
import { NOTIFICATIONS_HELP_PRIMARY_ACTION } from "@/lib/notifications-help-guide-content";
import {
  NOTIFICATIONS_HELP_FIRST_VIEWPORT_TEST_ID,
  NOTIFICATIONS_HELP_PRIMARY_CONTENT_ID,
  NOTIFICATIONS_HELP_SKIP_LINK_LABEL,
  NOTIFICATIONS_HELP_SKIP_TARGET_ID,
} from "@/lib/notifications-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpNotificationsGuideView buyer-polished shell (HEN)", () => {
  const entry = getProductDocumentationEntry("notifications");

  it("renders skip link, first-viewport action panel, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected notifications documentation entry.");
    }

    render(<HelpNotificationsGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: NOTIFICATIONS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${NOTIFICATIONS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-notifications-header-claim-discipline")).toHaveTextContent(
      NOTIFICATIONS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-notifications-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc-mobile")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-notifications-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(NOTIFICATIONS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(NOTIFICATIONS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-notifications-action-panel");
    const orientationBottom = screen.getByTestId("help-notifications-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-notifications-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-notifications-start-here-primary-cta")).toHaveAttribute(
      "href",
      NOTIFICATIONS_HELP_PRIMARY_ACTION.href,
    );

    for (const source of filterWhereToGoNextFollowUpLinks(NOTIFICATIONS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
