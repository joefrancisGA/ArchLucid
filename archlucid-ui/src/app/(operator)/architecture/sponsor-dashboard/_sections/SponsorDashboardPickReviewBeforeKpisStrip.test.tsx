import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SponsorDashboardPickReviewBeforeKpisStrip } from "./SponsorDashboardPickReviewBeforeKpisStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "", activeRunId: "" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

describe("SponsorDashboardPickReviewBeforeKpisStrip", () => {
  it("renders the pick-review strip", () => {
    render(
      <SponsorDashboardPickReviewBeforeKpisStrip selectedReviewId="" onSelectReview={() => undefined} />,
    );

    expect(screen.getByTestId("sponsor-dashboard-pick-review-before-kpis-strip")).toBeInTheDocument();
    expect(screen.getByText("Pick a review before reading sponsor KPIs")).toBeInTheDocument();
  });
});
