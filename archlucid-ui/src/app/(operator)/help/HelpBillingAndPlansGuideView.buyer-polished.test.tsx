import { screen } from "@testing-library/react";
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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
}));

vi.mock("@/hooks/use-tenant-trial-status-query", () => ({
  useTenantTrialStatusQuery: () => useTenantTrialStatusQuery(),
}));

vi.mock("@/lib/billing-portal-client", () => ({
  startBillingPortal: vi.fn(),
}));

vi.mock("@/lib/tenant-usage-status-client", () => ({
  fetchTenantUsageStatusCached: vi.fn().mockResolvedValue({
    isTrial: true,
    seatsUsed: 2,
    seatsLimit: 3,
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
  BILLING_HELP_PAGE_SUBTITLE,
  BILLING_HELP_PAGE_SUBTITLE_BUYER,
  BILLING_HELP_SCOPE_DETAILS_TRIGGER,
} from "@/lib/billing-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpBillingAndPlansGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("billing-and-plans");

  it("uses buyer subtitle and collapses overview copy", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    expect(screen.getByText(BILLING_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(BILLING_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-refresh-button")).toBeInTheDocument();
    expect(screen.queryByText(BILLING_HELP_SCOPE_DETAILS_TRIGGER)).toBeNull(); // TB-2093
    expect(screen.getByTestId("help-billing-overview")).toHaveTextContent(BILLING_HELP_OVERVIEW);
  });
});
