import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorDashboardLoadingSkeleton } from "@/components/sponsor/SponsorDashboardLoadingSkeleton";

describe("SponsorDashboardLoadingSkeleton (TB-1532)", () => {
  it("renders structured loading chrome with polite status text", () => {
    render(<SponsorDashboardLoadingSkeleton />);

    expect(screen.getByTestId("sponsor-dashboard-loading-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-dashboard-loading-time-range")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading sponsor dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Loading sponsor dashboard…")).toHaveClass("sr-only");
  });
});
