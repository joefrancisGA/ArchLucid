import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { billingHelpPageSubtitle } from "@/lib/billing-help-guide-content";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/billing-and-plans",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { HelpBillingAndPlansPageHeader } from "@/app/(operator)/help/_sections/HelpBillingAndPlansPageHeader";

describe("HelpBillingAndPlansPageHeader", () => {
  it("renders h1, help, refresh, and last-refreshed metadata", () => {
    const onRefresh = vi.fn();

    render(
      <HelpBillingAndPlansPageHeader
        subtitle={billingHelpPageSubtitle(false)}
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Billing and plans" })).toBeInTheDocument();
    expect(screen.getByText(billingHelpPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-billing-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("help-billing-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
