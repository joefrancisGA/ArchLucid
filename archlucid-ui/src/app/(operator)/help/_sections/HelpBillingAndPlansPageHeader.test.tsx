import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { billingHelpPageSubtitle } from "@/lib/billing-help-guide-content";
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

  it("renders help disambiguated title, refresh, and no provenance or freshness metadata", () => {
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
    expect(
      screen.getByRole("heading", { level: 1, name: "Billing and plans — help topic" }),
    ).toBeInTheDocument();
    expect(screen.getByText(billingHelpPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.queryByTestId("help-billing-source-of-record")).toBeNull();
    expect(screen.queryByTestId("help-billing-last-refreshed")).toBeNull();

    fireEvent.click(screen.getByTestId("help-billing-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("surfaces refresh errors without plan freshness metadata", () => {
    if (entry === undefined) {
      throw new Error("Expected billing-and-plans documentation entry.");
    }

    render(
      <HelpBillingAndPlansPageHeader
        entry={entry}
        subtitle={billingHelpPageSubtitle(false)}
        refreshing={false}
        lastRefreshedAt={null}
        refreshError="Billing snapshot unavailable."
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByTestId("help-billing-refresh-error")).toHaveTextContent("Billing snapshot unavailable.");
    expect(screen.queryByTestId("help-billing-last-refreshed")).toBeNull();
  });
});
