import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const useNavCallerAuthorityRank = vi.hoisted(() => vi.fn(() => 3));
const useTenantUsageStatusQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      isTrial: true,
      seatsUsed: 2,
      seatsLimit: 3,
    },
    isFetching: false,
  })),
);
const useTenantTrialStatusQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      status: "Active",
      daysRemaining: 5,
    },
    isLoading: false,
    isError: false,
  })),
);
const showError = vi.hoisted(() => vi.fn());

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
}));

vi.mock("@/hooks/use-tenant-trial-status-query", () => ({
  useTenantTrialStatusQuery: () => useTenantTrialStatusQuery(),
}));

vi.mock("@/hooks/use-tenant-usage-status-query", () => ({
  useTenantUsageStatusQuery: () => useTenantUsageStatusQuery(),
}));

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showError(...args),
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
  BILLING_HELP_FAQ_ITEMS,
  BILLING_HELP_GUIDE_HEADINGS,
  BILLING_HELP_NO_PERMISSION_HINT,
  BILLING_HELP_PAGE_DISPLAY_TITLE,
  BILLING_HELP_PAGE_SUBTITLE,
  BILLING_HELP_PAGE_TITLE,
  BILLING_HELP_PRIMARY_ACTIONS,
  BILLING_HELP_REFRESH_ERROR_MESSAGE,
  BILLING_HELP_SUBSCRIPTION_CHECKING_LABEL,
  BILLING_HELP_SUBSCRIPTION_UNAVAILABLE_LABEL,
  BILLING_HELP_VIEW_BILLING_ACTION,
} from "@/lib/billing-help-guide-content";
import {
  BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE,
  BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE_HEADING,
  BILLING_AND_PLANS_HELP_CLAIM_HEADING_ID,
  BILLING_AND_PLANS_HELP_SOURCES,
} from "@/lib/billing-and-plans-help-evidence-copy";
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
      isLoading: false,
      isError: false,
    });
    useTenantUsageStatusQuery.mockReturnValue({
      data: {
        isTrial: true,
        seatsUsed: 2,
        seatsLimit: 3,
      },
      isFetching: false,
    });
    showError.mockReset();
  });

  it("registers customer-facing billing help metadata", () => {
    expect(entry?.slug).toBe("billing-and-plans");
    expect(entry?.title).toBe(BILLING_HELP_PAGE_TITLE);
    expect(entry?.summary).toContain("Billing and plans");
    expect(entry?.sourcePaths).toContain("docs/library/customer-facing/BILLING_AND_PLANS.md");
    expect(entry?.lastReviewed).toBeTruthy();
    expect(entry?.releaseApplicability).toBeTruthy();
  });

  it("renders claim-discipline strip, table of contents, and core billing sections", async () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: BILLING_HELP_PAGE_DISPLAY_TITLE })).toBeInTheDocument();
    expect(screen.getByText(BILLING_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-billing-last-refreshed")).toBeNull();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.queryByTestId("help-billing-source-of-record")).toBeNull();
    expect(screen.getByTestId("help-billing-action-panel")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2, name: "How billing works" })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2, name: "Common questions" })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2, name: "Support" })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: "Your workspace" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Billing support" })).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-faq-list").children).toHaveLength(BILLING_HELP_FAQ_ITEMS.length);
    expect(screen.queryByText(/Sources package/i)).toBeNull();
    expect(screen.getByTestId("help-billing-claim-discipline").textContent).toContain(
      BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      BILLING_AND_PLANS_HELP_CLAIM_HEADING_ID,
    );

    for (const source of BILLING_AND_PLANS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    for (const heading of BILLING_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }

    await waitFor(() => {
      expect(screen.getByTestId("help-billing-current-plan-context")).toBeInTheDocument();
    });
  });

  it("links to public pricing and in-app billing for administrators", async () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const actionPanel = screen.getByTestId("help-billing-action-panel");

    await waitFor(() => {
      expect(within(actionPanel).getByTestId("help-billing-view-public-pricing")).toHaveAttribute("href", "/pricing");
    });

    expect(within(actionPanel).getByTestId("help-billing-view-public-pricing-wrap")).toBeInTheDocument();
    expect(within(actionPanel).getByText(/Public page/i)).toBeInTheDocument();
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

    await waitFor(() => {
      expect(within(context).getByText("Trial")).toBeInTheDocument();
      expect(within(actionPanel).getByText(/5 days remaining/i)).toBeInTheDocument();
      expect(within(context).getByTestId("help-billing-subscription-status")).toHaveTextContent(
        "No active subscription",
      );
      expect(within(context).getByText("Trial seats")).toBeInTheDocument();
      expect(within(context).getByText("2 of 3 in use")).toBeInTheDocument();
    });
  });

  it("shows no-paid-plan context when trial is not active", async () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    useTenantTrialStatusQuery.mockReturnValue({
      data: { status: "Expired", daysRemaining: 0 },
      isLoading: false,
      isError: false,
    });
    useTenantUsageStatusQuery.mockReturnValue({
      data: {
        isTrial: false,
        seatsUsed: 0,
        seatsLimit: 5,
      },
      isFetching: false,
    });

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const context = screen.getByTestId("help-billing-current-plan-context");

    await waitFor(() => {
      expect(within(context).getByText("No paid plan")).toBeInTheDocument();
      expect(within(context).getByTestId("help-billing-subscription-status")).toHaveTextContent(
        "No active subscription",
      );
      expect(within(context).queryByText(/seats/i)).not.toBeInTheDocument();
      expect(useTenantUsageStatusQuery).toHaveBeenCalled();
    });
  });

  it("shows checking subscription while plan data is pending", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    useTenantTrialStatusQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    useTenantUsageStatusQuery.mockReturnValue({ data: undefined, isFetching: true });

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const context = screen.getByTestId("help-billing-current-plan-context");

    expect(within(context).getByText("Checking…")).toBeInTheDocument();
    expect(within(context).getByTestId("help-billing-subscription-status")).toHaveTextContent(
      BILLING_HELP_SUBSCRIPTION_CHECKING_LABEL,
    );
    expect(within(context).queryByText("No paid plan")).not.toBeInTheDocument();
    expect(within(context).queryByText("No active subscription")).not.toBeInTheDocument();
  });

  it("shows unavailable subscription status when trial query errors", async () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    useTenantTrialStatusQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const context = screen.getByTestId("help-billing-current-plan-context");

    await waitFor(() => {
      expect(within(context).getByTestId("help-billing-subscription-status")).toHaveTextContent(
        BILLING_HELP_SUBSCRIPTION_UNAVAILABLE_LABEL,
      );
      expect(within(context).queryByText("No paid plan")).not.toBeInTheDocument();
      expect(within(context).queryByText("No active subscription")).not.toBeInTheDocument();
    });
  });

  it("shows a billing administrator hint for users without mutation permission", async () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    useNavCallerAuthorityRank.mockReturnValue(1);

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    const actionPanel = screen.getByTestId("help-billing-action-panel");
    const hint = within(actionPanel).getByTestId("help-billing-no-permission-hint");
    const pricingLink = within(actionPanel).getByTestId("help-billing-view-public-pricing");

    expect(hint).toHaveTextContent(BILLING_HELP_NO_PERMISSION_HINT);
    expect(hint.compareDocumentPosition(pricingLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      within(actionPanel).getByRole("link", { name: BILLING_HELP_VIEW_BILLING_ACTION.label }),
    ).toHaveAttribute("href", "/administration/billing");
    expect(
      within(actionPanel).getByRole("link", { name: BILLING_HELP_VIEW_BILLING_ACTION.label }),
    ).not.toHaveAttribute("title");
    expect(screen.queryByRole("button", { name: "Manage billing" })).not.toBeInTheDocument();
    expect(within(actionPanel).getByTestId("help-billing-view-public-pricing")).toBeInTheDocument();
  });

  it("keeps refresh control without plan freshness metadata", async () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    await waitFor(() => {
      expect(screen.getByTestId("help-billing-current-plan-context")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("help-billing-refresh-button"));

    expect(screen.queryByTestId("help-billing-last-refreshed")).toBeNull();
  });

  it("uses keyboard-operable FAQ accordions with expand affordance", async () => {
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

  it("renders help copy at the reading scale with a capped measure", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    renderWithOperatorQuery(<HelpBillingAndPlansGuideView entry={entry} />);

    expect(screen.getByTestId("help-billing-overview").className).toContain("text-[15px]");
    expect(screen.getByTestId("help-billing-overview").parentElement?.className).toContain("max-w-[75ch]");
  });

  it("avoids prohibited customer-facing billing terminology and duplicated pricing matrices", async () => {
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
