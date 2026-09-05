import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailFirstWeekRouteGuidanceMount } from "./RunDetailFirstWeekRouteGuidanceMount";

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: vi.fn(),
}));

vi.mock("./run-detail-page-view-deferred-chunks", () => ({
  RunDetailFirstWeekRouteGuidanceDeferred: () => (
    <div data-testid="first-week-route-guidance-review-detail-in-progress">Guidance</div>
  ),
}));

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

describe("RunDetailFirstWeekRouteGuidanceMount (CD-13)", () => {
  it("does not mount first-week guidance on Working review-detail", () => {
    vi.mocked(useProductionEvalChrome).mockReturnValue(false);

    render(<RunDetailFirstWeekRouteGuidanceMount variant="review-detail-in-progress" />);

    expect(screen.queryByTestId("first-week-route-guidance-review-detail-in-progress")).not.toBeInTheDocument();
  });

  it("mounts first-week guidance for Guided eval chrome", () => {
    vi.mocked(useProductionEvalChrome).mockReturnValue(true);

    render(<RunDetailFirstWeekRouteGuidanceMount variant="review-detail-in-progress" />);

    expect(screen.getByTestId("first-week-route-guidance-review-detail-in-progress")).toBeInTheDocument();
  });
});
