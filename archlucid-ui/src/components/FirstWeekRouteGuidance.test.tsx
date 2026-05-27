import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import { FIRST_WEEK_ROUTE_GUIDANCE } from "@/lib/first-week-route-guidance";

describe("FirstWeekRouteGuidance", () => {
  it("renders new-review guidance with wizard anchor CTA", () => {
    render(<FirstWeekRouteGuidance variant="new-review" />);

    expect(screen.getByTestId("first-week-route-guidance-new-review")).toBeInTheDocument();
    expect(screen.getByText(/Use this when:/)).toBeInTheDocument();
    expect(screen.getByText(FIRST_WEEK_ROUTE_GUIDANCE["new-review"].bridgeCopy)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue in wizard below" })).toHaveAttribute(
      "href",
      "#new-review-wizard",
    );
  });

  it("renders in-progress review detail guidance with finalize anchor", () => {
    render(<FirstWeekRouteGuidance variant="review-detail-in-progress" />);

    expect(screen.getByRole("link", { name: "Go to finalize actions" })).toHaveAttribute("href", "#run-actions");
    expect(screen.getByText(/Skip graph, replay, and governance dashboards/i)).toBeInTheDocument();
  });

  it("renders committed review detail guidance with exports anchor", () => {
    render(<FirstWeekRouteGuidance variant="review-detail-committed" />);

    expect(screen.getByRole("link", { name: "Open exports section" })).toHaveAttribute(
      "href",
      "#artifacts-exports",
    );
  });

  it("renders onboarding guidance with new review route CTA", () => {
    render(<FirstWeekRouteGuidance variant="onboarding" />);

    expect(screen.getByRole("link", { name: "Open new review wizard" })).toHaveAttribute("href", "/reviews/new");
  });
});
