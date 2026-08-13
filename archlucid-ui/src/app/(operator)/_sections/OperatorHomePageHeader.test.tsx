import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { operatorHomePageSubtitle } from "@/lib/operator/operator-home-page-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

const requestRefresh = vi.fn();

vi.mock("@/lib/operator/operator-home-refresh-context", () => ({
  useOperatorHomeRefresh: () => ({
    refreshing: false,
    lastRefreshedAt: new Date("2026-07-09T12:00:00.000Z"),
    requestRefresh,
  }),
}));

import { OperatorHomePageHeader } from "@/app/(operator)/_sections/OperatorHomePageHeader";

describe("OperatorHomePageHeader", () => {
  it("renders Home title, help, and refresh without Last refreshed metadata", () => {
    requestRefresh.mockReset();

    render(<OperatorHomePageHeader subtitle={operatorHomePageSubtitle(false)} />);

    expect(screen.getByTestId("operator-home-page-title")).toHaveTextContent("Home");
    expect(screen.getByRole("heading", { level: 2, name: "Home" })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-page-subtitle")).toHaveTextContent(
      operatorHomePageSubtitle(false),
    );
    expect(screen.getByTestId("operator-home-page-subtitle").className).not.toContain("max-w-2xl");
    expect(screen.getByTestId("operator-home-page-subtitle").className).toContain("text-[13px]");
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-last-refreshed")).toBeNull();
    expect(screen.queryByText("Last refreshed:")).toBeNull();

    fireEvent.click(screen.getByTestId("operator-home-refresh-button"));

    expect(requestRefresh).toHaveBeenCalledTimes(1);
  });

  // ADR 0067 — the lead names two co-equal ways in; it must not number or rank the paths.
  it("bolds the co-equal lead label on the buyer-polished Home lead", () => {
    render(<OperatorHomePageHeader subtitle={operatorHomePageSubtitle(true)} />);

    const label = screen.getByText(OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL);
    expect(label.tagName).toBe("STRONG");
    expect(label.className).toContain("font-bold");
    expect(screen.getByTestId("operator-home-page-subtitle")).toHaveTextContent(
      operatorHomePageSubtitle(true),
    );
  });
});
