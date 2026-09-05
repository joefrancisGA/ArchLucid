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

vi.mock("@/lib/use-alerts-help-workspace-readiness", () => ({
  useAlertsHelpWorkspaceReadiness: () => ({
    loading: false,
    loadFailed: false,
    loadForbidden: false,
    enabledRulesCount: 0,
    enabledRulesLabel: "0 enabled rules",
    enabledRulesStatusKind: "needs-attention",
    openAlertsLabel: "No open alerts",
    openAlertsStatusKind: "neutral",
    routingDestinationsLabel: "No routing configured",
    routingDestinationsStatusKind: "needs-attention",
    lastEvaluationLabel: "Rules not configured",
    lastEvaluationStatusKind: "needs-attention",
    workspaceScopeLabel: "This workspace",
    loadedAtUtc: "2026-07-10T12:00:00.000Z",
    reload: vi.fn(),
  }),
}));

import { HelpAlertsGuideView } from "@/app/(operator)/help/_sections/HelpAlertsGuideView";
import {
  ALERTS_HELP_ACTION_PANEL_TITLES,
  ALERTS_HELP_PRIMARY_ACTIONS,
} from "@/lib/alerts-help-guide-content";
import {
  ALERTS_HELP_CLAIM_DISCIPLINE,
  ALERTS_HELP_FOLLOW_UPS_TITLE,
  ALERTS_HELP_SOURCES,
} from "@/lib/alerts-help-evidence-copy";
import {
  ALERTS_HELP_FIRST_VIEWPORT_TEST_ID,
  ALERTS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ALERTS_HELP_PAGE_SUBTITLE_BUYER,
  ALERTS_HELP_PRIMARY_CONTENT_ID,
  ALERTS_HELP_SKIP_LINK_LABEL,
  ALERTS_HELP_SKIP_TARGET_ID,
} from "@/lib/alerts-help-page-copy";
import { ALERTS_HELP_PAGE_SUBTITLE } from "@/lib/alerts-help-guide-content";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAlertsGuideView buyer-polished shell (HA)", () => {
  const entry = getProductDocumentationEntry("alerts");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected alerts documentation entry.");
    }

    render(<HelpAlertsGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: ALERTS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ALERTS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(ALERTS_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(ALERTS_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(ALERTS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      ALERTS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-alerts-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-alerts-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-alerts-workspace-readiness")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ALERTS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-alerts-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ALERTS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ALERTS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-alerts-action-panel");
    const orientationBottom = screen.getByTestId("help-alerts-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-alerts-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(within(actionPanel).getByText(ALERTS_HELP_ACTION_PANEL_TITLES["rules-not-configured"])).toBeInTheDocument();
    expect(
      within(actionPanel).getByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label }),
    ).toHaveAttribute("href", ALERTS_HELP_PRIMARY_ACTIONS.configureRules.href);

    for (const source of filterWhereToGoNextFollowUpLinks(ALERTS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
