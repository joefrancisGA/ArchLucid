import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { operatorHomePageSubtitle } from "@/lib/operator-home-page-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

const requestRefresh = vi.fn();

vi.mock("@/lib/operator-home-refresh-context", () => ({
  useOperatorHomeRefresh: () => ({
    refreshing: false,
    lastRefreshedAt: new Date("2026-07-09T12:00:00.000Z"),
    requestRefresh,
  }),
}));

import { OperatorHomePageHeader } from "@/app/(operator)/_sections/OperatorHomePageHeader";

describe("OperatorHomePageHeader", () => {
  it("renders Overview title, help, refresh, and last-refreshed metadata", () => {
    requestRefresh.mockReset();

    render(<OperatorHomePageHeader subtitle={operatorHomePageSubtitle(false)} />);

    expect(screen.getByTestId("operator-home-page-title")).toHaveTextContent("Overview");
    expect(screen.getByRole("heading", { level: 2, name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText(operatorHomePageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByText(operatorHomePageSubtitle(false)).className).toContain("max-w-none");
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-last-refreshed")).toHaveTextContent(/Last refreshed:/i);
    expect(screen.getByText("Last refreshed:").tagName).toBe("STRONG");
    expect(screen.getByText("Last refreshed:").className).toContain("font-bold");

    fireEvent.click(screen.getByTestId("operator-home-refresh-button"));

    expect(requestRefresh).toHaveBeenCalledTimes(1);
  });
});
