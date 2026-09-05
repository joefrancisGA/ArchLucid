import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpAuditTrailGuideView } from "@/app/(operator)/help/_sections/HelpAuditTrailGuideView";
import {
  AUDIT_TRAIL_HELP_OVERVIEW,
  AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER,
  AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR,
  AUDIT_TRAIL_HELP_PRIMARY_ACTIONS,
  AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF,
} from "@/lib/audit-trail-help-guide-content";
import {
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
  AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_HELP_SOURCES,
} from "@/lib/audit-trail-help-evidence-copy";
import {
  AUDIT_TRAIL_HELP_FIRST_VIEWPORT_TEST_ID,
  AUDIT_TRAIL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AUDIT_TRAIL_HELP_PRIMARY_CONTENT_ID,
  AUDIT_TRAIL_HELP_SKIP_LINK_LABEL,
  AUDIT_TRAIL_HELP_SKIP_TARGET_ID,
  AUDIT_TRAIL_HELP_START_HERE_CARD_TITLE,
} from "@/lib/audit-trail-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpAuditTrailGuideView buyer-polished shell (H)", () => {
  const loaded = tryLoadProductDocumentation("audit-trail");

  it("renders skip link, start-here panel before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: AUDIT_TRAIL_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUDIT_TRAIL_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR)).not.toBeInTheDocument();
    expect(screen.getByTestId(AUDIT_TRAIL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-audit-trail-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-audit-trail-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("audit-trail-help-sources")).toBeInTheDocument();

    const sourceOfRecordLink = screen.getByRole("link", { name: "Data handling" });
    expect(sourceOfRecordLink).toHaveAttribute("href", AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF);
    expect(screen.getByTestId("help-audit-trail-source-of-record")).toHaveTextContent("Related topic: Data handling");
    expect(screen.getByTestId("help-audit-trail-overview")).toHaveTextContent(AUDIT_TRAIL_HELP_OVERVIEW);
    expect(screen.getByTestId("help-audit-trail-immutability-claims")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(AUDIT_TRAIL_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(AUDIT_TRAIL_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-audit-trail-action-panel");
    const orientationBottom = screen.getByTestId("help-audit-trail-orientation-bottom");
    const sourcesSection = screen.getByTestId("audit-trail-help-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      screen.getByRole("heading", { level: 2, name: AUDIT_TRAIL_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(
      within(actionPanel).getByRole("link", { name: AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.openAuditTrail.label }),
    ).toHaveAttribute("href", AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.openAuditTrail.href);

    for (const source of filterWhereToGoNextFollowUpLinks(AUDIT_TRAIL_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
