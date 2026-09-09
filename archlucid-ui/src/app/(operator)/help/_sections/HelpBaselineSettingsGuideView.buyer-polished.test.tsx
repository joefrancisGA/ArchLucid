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

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/baseline-settings",
}));

import { HelpBaselineSettingsGuideView } from "@/app/(operator)/help/_sections/HelpBaselineSettingsGuideView";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import {
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_HELP_SOURCES,
} from "@/lib/baseline-settings-help-evidence-copy";
import {
  BASELINE_SETTINGS_HELP_PAGE_SUBTITLE,
  BASELINE_SETTINGS_HELP_PRIMARY_ACTION,
  BASELINE_SETTINGS_HELP_BUYER_START_HERE_HELPER,
  BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE,
} from "@/lib/baseline-settings-help-guide-content";
import {
  BASELINE_SETTINGS_HELP_BUYER_OVERVIEW,
  BASELINE_SETTINGS_HELP_FIRST_VIEWPORT_TEST_ID,
  BASELINE_SETTINGS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  BASELINE_SETTINGS_HELP_ORIENTATION_BOTTOM_TEST_ID,
  BASELINE_SETTINGS_HELP_PAGE_LEAD,
  BASELINE_SETTINGS_HELP_PAGE_SUBTITLE_BUYER,
  BASELINE_SETTINGS_HELP_PRIMARY_CONTENT_ID,
  BASELINE_SETTINGS_HELP_SKIP_LINK_LABEL,
  BASELINE_SETTINGS_HELP_SKIP_TARGET_ID,
  BASELINE_SETTINGS_HELP_WORKSPACE_TEST_ID,
} from "@/lib/baseline-settings-help-page-copy";
import { BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER } from "@/lib/baseline-settings-present";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { formatHelpTopicApplicabilityMetadata } from "@/lib/help/help-topic-applicability-metadata";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpBaselineSettingsGuideView buyer-polished shell (HEB)", () => {
  const entry = getProductDocumentationEntry("baseline-settings");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected baseline-settings documentation entry.");
    }

    render(<HelpBaselineSettingsGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: BASELINE_SETTINGS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${BASELINE_SETTINGS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(BASELINE_SETTINGS_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(BASELINE_SETTINGS_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(BASELINE_SETTINGS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-baseline-settings-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-baseline-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-baseline-settings-buyer-provenance")).toHaveTextContent(
      formatHelpTopicApplicabilityMetadata(entry)!,
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-baseline-settings-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc-mobile")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-baseline-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-baseline-settings-intro")).toHaveTextContent(BASELINE_SETTINGS_HELP_PAGE_LEAD);
    expect(screen.getByTestId("help-baseline-settings-overview")).toHaveTextContent(
      BASELINE_SETTINGS_HELP_BUYER_OVERVIEW,
    );

    const primaryContent = screen.getByTestId(BASELINE_SETTINGS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(BASELINE_SETTINGS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-baseline-settings-action-panel");
    const overview = screen.getByTestId("help-baseline-settings-overview");
    const workspace = screen.getByTestId(BASELINE_SETTINGS_HELP_WORKSPACE_TEST_ID);
    const anchorItems = screen.getByTestId("help-baseline-settings-anchor-items");
    const orientationBottom = screen.getByTestId(BASELINE_SETTINGS_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("help-baseline-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(screen.getByTestId("help-baseline-settings-intro"));
    expect(firstViewport).toContainElement(actionPanel);
    expect(firstViewport).not.toContainElement(overview);
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(workspace);
    expect(workspace).toContainElement(anchorItems);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-baseline-settings-saved-baseline-warn")).toHaveTextContent(
      BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER,
    );
    expect(screen.getByTestId("help-baseline-settings-buyer-start-here-helper")).toHaveTextContent(
      BASELINE_SETTINGS_HELP_BUYER_START_HERE_HELPER,
    );
    expect(
      within(actionPanel).queryByRole("link", { name: BASELINE_SETTINGS_HELP_PRIMARY_ACTION.label }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(BASELINE_SETTINGS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
