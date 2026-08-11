import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { billingHelpPageSubtitle } from "@/lib/billing-help-guide-content";
import { OPERATOR_NOT_REFRESHED_LABEL } from "@/lib/operator-last-refreshed-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/billing-and-plans",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpBillingAndPlansPageHeader } from "@/app/(operator)/help/_sections/HelpBillingAndPlansPageHeader";

describe("HelpBillingAndPlansPageHeader", () => {
  const entry = getProductDocumentationEntry("billing-and-plans");

  it("renders help breadcrumb, disambiguated title, provenance, refresh, and plan freshness metadata", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    const onRefresh = vi.fn();

    render(
      <HelpBillingAndPlansPageHeader
        entry={entry}
        subtitle={billingHelpPageSubtitle(false)}
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        refreshError={null}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByTestId("help-billing-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(
      screen.getByRole("heading", { level: 1, name: "Billing and plans — help topic" }),
    ).toBeInTheDocument();
    expect(screen.getByText(billingHelpPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(/Last reviewed/i);
    expect(screen.getByTestId("help-billing-source-of-record")).toHaveTextContent("BILLING_AND_PLANS.md");
    expect(screen.getByTestId("help-billing-last-refreshed")).toHaveTextContent(/Plan data:/i);
    expect(screen.getByTestId("help-billing-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("help-billing-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows the honest empty freshness state before the first successful load", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    render(
      <HelpBillingAndPlansPageHeader
        entry={entry}
        subtitle={billingHelpPageSubtitle(false)}
        refreshing={false}
        lastRefreshedAt={null}
        refreshError={null}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByTestId("help-billing-last-refreshed")).toHaveTextContent(OPERATOR_NOT_REFRESHED_LABEL);
    expect(screen.getByTestId("help-billing-last-refreshed")).not.toHaveTextContent(
      "Last refreshed: Not refreshed yet",
    );
  });
});
