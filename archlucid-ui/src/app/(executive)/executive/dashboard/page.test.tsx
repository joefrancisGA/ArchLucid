import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/dashboard/_sections/ExecutiveRoiDashboardPageView", () => ({
  ExecutiveRoiDashboardPageView: ({ surface }: { surface?: string }) => (
    <div data-testid="exec-dashboard-view" data-surface={surface ?? "operator"} />
  ),
}));

import ExecutiveDashboardPage from "./page";

describe("ExecutiveDashboardPage", () => {
  it("renders dashboard view in executive surface mode", () => {
    render(<ExecutiveDashboardPage />);

    expect(screen.getByTestId("exec-dashboard-view")).toHaveAttribute("data-surface", "executive");
  });
});
