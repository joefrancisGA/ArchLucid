import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const useNavCallerAuthorityRank = vi.hoisted(() => vi.fn(() => 3));
const fetchTenantUsageStatusCached = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    isTrial: true,
    seatsUsed: 2,
    seatsLimit: 3,
  }),
);
const useTenantTrialStatusQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      status: "Active",
      daysRemaining: 5,
    },
  })),
);

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
}));

vi.mock("@/hooks/use-tenant-trial-status-query", () => ({
  useTenantTrialStatusQuery: () => useTenantTrialStatusQuery(),
}));

vi.mock("@/lib/tenant-usage-status-client", () => ({
  fetchTenantUsageStatusCached,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isNextPublicDemoMode: () => false,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/lib/frictionless-trial-session", () => ({
  readFrictionlessTrialSessionEnabled: () => false,
}));

vi.mock("@/lib/operator-scope-storage", () => ({
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
  BILLING_HELP_FAQ_ITEMS,
  BILLING_HELP_NO_PERMISSION_HINT,
  BILLING_HELP_PAGE_DISPLAY_TITLE,
  BILLING_HELP_PAGE_SUBTITLE,
  BILLING_HELP_PAGE_TITLE,
  BILLING_HELP_PRIMARY_ACTIONS,
} from "@/lib/billing-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_CUSTOMER_COPY = [
  "stripe",
  "checkout session",
  "paymentintent",
  "webhook",
  "price id",
  "product id",
  "billing api",
  "entitlement key",
  "sku",
  "tenant record",
  "v1.1",
  " v1 ",
  " v2 ",
  "architect plan",
  "team plan",
  "professional plan",
  "enterprise plan",
  "$99",
  "$249",
  "$1,799",
  "prorat",
  "refund",
  "purchase order",
  "annual billing",
  "overage",
] as const;

describe("HelpBillingAndPlansGuideView", () => {
  const entry = getProductDocumentationEntry("billing-and-plans");

  beforeEach(() => {
    useNavCallerAuthorityRank.mockReturnValue(3);
    useTenantTrialStatusQuery.mockReturnValue({
      data: {
        status: "Active",
        daysRemaining: 5,
      },
    });
    fetchTenantUsageStatusCached.mockResolvedValue({
      isTrial: true,
      seatsUsed: 2,
      seatsLimit: 3,
    });
  });

  it("registers customer-facing billing help metadata", () => {
    expect(entry?.slug).toBe("billing-and-plans");
    expect(entry?.title).toBe(BILLING_HELP_PAGE_TITLE);
    expect(entry?.summary).toContain("Billing and plans");
    expect(entry?.sourcePaths).toContain("docs/library/customer-facing/BILLING_AND_PLANS.md");
  });

  it("renders the reduced page structure without an on-this-page table of contents", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 2, name: BILLING_HELP_PAGE_DISPLAY_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByText(BILLING_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-last-refreshed")).toHaveTextContent(/Last refreshed:/i);
    expect(screen.getByTestId("help-billing-action-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How billing works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Common questions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Support" })).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-billing-faq-list").children).toHaveLength(BILLING_HELP_FAQ_ITEMS.length);
  });

  it("links to public pricing and in-app billing for administrators", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const actionPanel = screen.getByTestId("help-billing-action-panel");

    expect(within(actionPanel).getByTestId("help-billing-view-public-pricing")).toHaveAttribute("href", "/pricing");
    expect(within(actionPanel).getByTestId("help-billing-view-public-pricing")).toHaveTextContent(/Public page/i);
    expect(
      within(actionPanel).getByRole("link", { name: BILLING_HELP_PRIMARY_ACTIONS.manageBilling.label }),
    ).toHaveAttribute("href", "/administration/billing");
    expect(screen.queryByTestId("help-billing-no-permission-hint")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Manage billing" })).not.toBeInTheDocument();
  });

  it("shows trial context and seat summary for trial users", async () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const actionPanel = screen.getByTestId("help-billing-action-panel");
    const context = screen.getByTestId("help-billing-current-plan-context");

    expect(within(context).getByText("Trial")).toBeInTheDocument();
    expect(within(actionPanel).getByText(/5 days remaining/i)).toBeInTheDocument();
    expect(within(context).getByTestId("help-billing-subscription-status")).toHaveTextContent(
      "No active subscription",
    );

    await waitFor(() => {
      expect(within(context).getByText("Trial seats")).toBeInTheDocument();
      expect(within(context).getByText("2 of 3 in use")).toBeInTheDocument();
    });
  });

  it("shows no-paid-plan context when trial is not active", async () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    useTenantTrialStatusQuery.mockReturnValue({ data: { status: "Expired", daysRemaining: 0 } });
    fetchTenantUsageStatusCached.mockResolvedValue({
      isTrial: false,
      seatsUsed: 0,
      seatsLimit: 5,
    });

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const context = screen.getByTestId("help-billing-current-plan-context");

    expect(within(context).getByText("No paid plan")).toBeInTheDocument();
    expect(within(context).getByTestId("help-billing-subscription-status")).toHaveTextContent(
      "No active subscription",
    );
    expect(within(context).queryByText(/seats/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(fetchTenantUsageStatusCached).toHaveBeenCalled();
    });
  });

  it("shows a billing administrator hint for users without mutation permission", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    useNavCallerAuthorityRank.mockReturnValue(1);

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const actionPanel = screen.getByTestId("help-billing-action-panel");

    expect(within(actionPanel).getByTestId("help-billing-no-permission-hint")).toHaveTextContent(
      BILLING_HELP_NO_PERMISSION_HINT,
    );
    expect(within(actionPanel).getByRole("link", { name: "Open Billing and plans" })).toHaveAttribute(
      "href",
      "/administration/billing",
    );
    expect(screen.queryByRole("button", { name: "Manage billing" })).not.toBeInTheDocument();
    expect(within(actionPanel).getByTestId("help-billing-view-public-pricing")).toBeInTheDocument();
  });

  it("uses keyboard-operable FAQ accordions with expand affordance", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const firstFaq = screen.getByTestId("help-billing-faq-trial-ends");
    const summary = within(firstFaq).getByText("What happens when my trial ends?");

    expect(summary.tagName.toLowerCase()).toBe("span");
    expect(firstFaq.tagName.toLowerCase()).toBe("details");
    expect(within(firstFaq).getByText(/choose a paid plan/i)).not.toBeVisible();
    expect(firstFaq.querySelector("svg")).toBeInTheDocument();

    fireEvent.click(summary);

    expect(within(firstFaq).getByText(/choose a paid plan/i)).toBeVisible();
  });

  it("avoids prohibited customer-facing billing terminology and duplicated pricing matrices", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const pageText = document.body.textContent?.toLowerCase() ?? "";

    for (const phrase of BANNED_CUSTOMER_COPY) {
      expect(pageText, `should not contain "${phrase}"`).not.toContain(phrase);
    }

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
