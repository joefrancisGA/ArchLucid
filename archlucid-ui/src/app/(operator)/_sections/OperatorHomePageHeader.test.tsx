import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BUYER_OPERATOR_HOME_PAGE_SUBTITLE, OPERATOR_HOME_DATA_CURRENCY_PREFIX } from "@/lib/buyer/buyer-polish-copy";
import { operatorHomePageSubtitle } from "@/lib/operator/operator-home-page-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: ({ triggerText }: { readonly triggerText?: string }) => (
    <div data-testid="page-contextual-help-button">{triggerText ?? "Help"}</div>
  ),
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

const requestRefresh = vi.fn();

vi.mock("@/lib/operator/operator-home-refresh-context", () => ({
  useOperatorHomeRefresh: () => ({
    refreshing: false,
    lastRefreshedAt: new Date(),
    requestRefresh,
  }),
}));

import { OperatorHomePageHeader } from "@/app/(operator)/_sections/OperatorHomePageHeader";

describe("OperatorHomePageHeader", () => {
  it("renders Home title, Help trigger, data-currency metadata, and refresh", () => {
    requestRefresh.mockReset();

    render(<OperatorHomePageHeader subtitle={operatorHomePageSubtitle(false)} />);

    expect(screen.getByTestId("operator-home-page-title")).toHaveTextContent("Home");
    expect(screen.getByRole("heading", { level: 2, name: "Home" })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-page-subtitle")).toHaveTextContent(
      operatorHomePageSubtitle(false),
    );
    expect(screen.getByTestId("operator-home-page-subtitle").className).not.toContain("max-w-2xl");
    expect(screen.getByTestId("operator-home-page-subtitle").className).toContain("text-[13px]");
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent("Help");
    expect(screen.getByTestId("operator-home-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-data-currency")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-data-currency").textContent).toMatch(/^Refreshed:/);

    const updatedValue = screen.getByTestId("operator-home-data-currency").querySelector("strong");
    expect(updatedValue).not.toBeNull();
    expect(updatedValue?.className).toContain("font-semibold");
    expect(screen.getByTestId("operator-home-data-currency").textContent?.toLowerCase()).not.toMatch(/\bnow\b/);

    expect(screen.getByTestId("operator-home-refresh-button")).toBeInTheDocument();
    expect(screen.queryByText("Last refreshed:")).toBeNull();

    fireEvent.click(screen.getByTestId("operator-home-refresh-button"));

    expect(requestRefresh).toHaveBeenCalledTimes(1);
  });

  it("omits the buyer-polished Home subtitle", () => {
    render(<OperatorHomePageHeader subtitle={operatorHomePageSubtitle(true)} />);

    expect(screen.queryByTestId("operator-home-page-subtitle")).toBeNull();
    expect(screen.queryByText(BUYER_OPERATOR_HOME_PAGE_SUBTITLE)).toBeNull();
  });

  it("uses working-desk subtitle copy in Working mode", () => {
    render(<OperatorHomePageHeader subtitle={operatorHomePageSubtitle(false, true)} />);

    expect(screen.getByTestId("operator-home-page-subtitle")).toHaveTextContent(
      operatorHomePageSubtitle(false, true),
    );
    expect(screen.getByTestId("operator-home-page-subtitle")).not.toHaveTextContent(
      operatorHomePageSubtitle(false),
    );
  });
});
