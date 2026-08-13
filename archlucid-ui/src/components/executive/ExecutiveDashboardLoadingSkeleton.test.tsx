import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutiveDashboardLoadingSkeleton } from "@/components/executive/ExecutiveDashboardLoadingSkeleton";

describe("ExecutiveDashboardLoadingSkeleton (TB-1532)", () => {
  it("renders structured loading chrome with polite status text", () => {
    render(<ExecutiveDashboardLoadingSkeleton />);

    expect(screen.getByTestId("executive-dashboard-loading-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("executive-dashboard-loading-time-range")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading executive dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Loading executive dashboard…")).toHaveClass("sr-only");
  });
});
