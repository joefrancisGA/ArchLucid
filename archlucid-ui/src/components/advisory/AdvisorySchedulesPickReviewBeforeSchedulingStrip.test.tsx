import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdvisorySchedulesPickReviewBeforeSchedulingStrip } from "./AdvisorySchedulesPickReviewBeforeSchedulingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-schedule-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string; onChange: (value: string) => void }) => (
    <button type="button" data-testid="ask-run-id-picker" onClick={() => props.onChange("run-picked-1")}>
      {props.value}
    </button>
  ),
}));

describe("AdvisorySchedulesPickReviewBeforeSchedulingStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <AdvisorySchedulesPickReviewBeforeSchedulingStrip selectedReviewId="" onSelectReview={() => undefined} />,
    );

    expect(screen.getByTestId("advisory-schedules-pick-review-before-scheduling-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before scheduling/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-schedule-1");
  });

  it("forwards a picked review without auto-selecting workspace", () => {
    const onSelectReview = vi.fn();
    render(
      <AdvisorySchedulesPickReviewBeforeSchedulingStrip selectedReviewId="" onSelectReview={onSelectReview} />,
    );

    expect(onSelectReview).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("ask-run-id-picker"));

    expect(onSelectReview).toHaveBeenCalledWith("run-picked-1");
  });
});
