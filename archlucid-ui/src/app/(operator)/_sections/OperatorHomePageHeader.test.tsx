import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { operatorHomePageSubtitle } from "@/lib/operator/operator-home-page-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
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
    expect(screen.getByTestId("operator-home-page-subtitle").className).toContain("max-w-none");
    expect(screen.getByTestId("operator-home-page-subtitle").className).toContain("text-[13px]");
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-last-refreshed")).toBeNull();
    expect(screen.queryByText("Last refreshed:")).toBeNull();

    fireEvent.click(screen.getByTestId("operator-home-refresh-button"));

    expect(requestRefresh).toHaveBeenCalledTimes(1);
  });

  it("bolds One lifecycle: on the buyer-polished Home lead", () => {
    render(<OperatorHomePageHeader subtitle={operatorHomePageSubtitle(true)} />);

    const label = screen.getByText("One lifecycle:");
    expect(label.tagName).toBe("STRONG");
    expect(label.className).toContain("font-bold");
    expect(screen.getByTestId("operator-home-page-subtitle")).toHaveTextContent(
      operatorHomePageSubtitle(true),
    );
  });
});
