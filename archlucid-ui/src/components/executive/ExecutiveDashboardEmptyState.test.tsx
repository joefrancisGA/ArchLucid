import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/SeedSampleReviewButton", () => ({
  SeedSampleReviewButton: () => <button type="button">Load sample workspace</button>,
}));

import { ExecutiveDashboardEmptyState } from "@/components/executive/ExecutiveDashboardEmptyState";

describe("ExecutiveDashboardEmptyState", () => {
  it("renders executive empty copy and primary actions", () => {
    render(<ExecutiveDashboardEmptyState />);

    expect(screen.getByTestId("executive-dashboard-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No committed reviews yet.")).toBeInTheDocument();
    expect(
      screen.getByText("Run or commit a review to populate executive risk, ROI, and compliance trends."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start review" })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("link", { name: "Upload baseline inventory" })).toHaveAttribute(
      "href",
      "/reviews/new?baseline=1",
    );
  });
});
