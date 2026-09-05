import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const useNavCallerAuthorityRank = vi.hoisted(() => vi.fn(() => 3));
const useTenantTrialStatusQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      status: "Active",
      daysRemaining: 5,
    },
  })),
);

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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/billing-and-plans",
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
}));

vi.mock("@/hooks/use-tenant-trial-status-query", () => ({
  useTenantTrialStatusQuery: () => useTenantTrialStatusQuery(),
}));

vi.mock("@/lib/billing-portal-client", () => ({
  startBillingPortal: vi.fn(),
}));

vi.mock("@/hooks/use-tenant-usage-status-query", () => ({
  useTenantUsageStatusQuery: () => ({
    data: {
      isTrial: true,
      seatsUsed: 2,
      seatsLimit: 3,
    },
    isFetching: false,
  }),
}));

vi.mock("@/lib/frictionless-trial-session", () => ({
  readFrictionlessTrialSessionEnabled: () => false,
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT: "archlucid:operator-scope-changed",
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    workspaceLabel: "Pilot workspace",
    projectLabel: "Default",
  }),
}));

import { HelpBillingAndPlansGuideView } from "@/app/(operator)/help/_sections/HelpBillingAndPlansGuideView";
import {
  BILLING_HELP_OVERVIEW,
  BILLING_HELP_PAGE_SUBTITLE_BUYER,
  BILLING_HELP_SCOPE_DETAILS_TRIGGER,
} from "@/lib/billing-help-guide-content";
import {
  BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE,
  BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE,
  BILLING_AND_PLANS_HELP_SOURCES,
} from "@/lib/billing-and-plans-help-evidence-copy";
import {
  BILLING_HELP_FIRST_VIEWPORT_TEST_ID,
  BILLING_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  BILLING_HELP_SKIP_LINK_LABEL,
  BILLING_HELP_SKIP_TARGET_ID,
} from "@/lib/billing-and-plans-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpBillingAndPlansGuideView buyer-polished shell (HBX)", () => {
  const entry = getProductDocumentationEntry("billing-and-plans");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: BILLING_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${BILLING_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(BILLING_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId(BILLING_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-billing-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-billing-and-plans-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-billing-refresh-button")).toBeInTheDocument();
    expect(screen.queryByText(BILLING_HELP_SCOPE_DETAILS_TRIGGER)).toBeNull();
    expect(screen.getByTestId("help-billing-overview")).toHaveTextContent(BILLING_HELP_OVERVIEW);
    expect(screen.getByRole("heading", { level: 2, name: BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-and-plans-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-billing-primary-content");
    const firstViewport = screen.getByTestId(BILLING_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-billing-action-panel");
    const orientationBottom = screen.getByTestId("help-billing-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-billing-and-plans-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);

    const visibleSources = filterWhereToGoNextFollowUpLinks(BILLING_AND_PLANS_HELP_SOURCES);
    for (const source of visibleSources) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
