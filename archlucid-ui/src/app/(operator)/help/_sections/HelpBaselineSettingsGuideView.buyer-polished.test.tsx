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
  BASELINE_SETTINGS_HELP_PRIMARY_ACTION,
  BASELINE_SETTINGS_HELP_BUYER_START_HERE_HELPER,
  BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE,
} from "@/lib/baseline-settings-help-guide-content";
import {
  BASELINE_SETTINGS_HELP_FIRST_VIEWPORT_TEST_ID,
  BASELINE_SETTINGS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  BASELINE_SETTINGS_HELP_SKIP_LINK_LABEL,
  BASELINE_SETTINGS_HELP_SKIP_TARGET_ID,
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
    expect(screen.getByRole("heading", { level: 2, name: BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-baseline-settings-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-baseline-settings-primary-content");
    const firstViewport = screen.getByTestId(BASELINE_SETTINGS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-baseline-settings-action-panel");
    const orientationBottom = screen.getByTestId("help-baseline-settings-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-baseline-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
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
    expect(screen.getByTestId("help-baseline-settings-overview")).toHaveTextContent(/measurement anchors/);
    expect(firstViewport).toContainElement(screen.getByTestId("help-baseline-settings-overview"));
    expect(
      screen.getByRole("heading", { level: 2, name: BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(BASELINE_SETTINGS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
