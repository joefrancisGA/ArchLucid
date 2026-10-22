import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlanningPickReviewBeforePlanningStrip } from "./PlanningPickReviewBeforePlanningStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-plan-1", displayTitle: "Claims review" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("PlanningPickReviewBeforePlanningStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <PlanningPickReviewBeforePlanningStrip selectedReviewId="" onSelectReview={() => undefined} />,
    );

    expect(screen.getByTestId("planning-pick-review-before-planning-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before planning/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-plan-1");
  });
});
