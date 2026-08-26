import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertTuningPickReviewBeforeTuningStrip } from "./AlertTuningPickReviewBeforeTuningStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-tune-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string; onChange: (value: string) => void }) => (
    <button type="button" data-testid="ask-run-id-picker" onClick={() => props.onChange("run-picked-1")}>
      {props.value}
    </button>
  ),
}));

describe("AlertTuningPickReviewBeforeTuningStrip", () => {
  it("renders review picker guidance", () => {
    render(<AlertTuningPickReviewBeforeTuningStrip selectedReviewId="" onSelectReview={() => undefined} />);

    expect(screen.getByTestId("alert-tuning-pick-review-before-tuning-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before tuning/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-tune-1");
  });

  it("forwards a picked review", () => {
    const onSelectReview = vi.fn();
    render(<AlertTuningPickReviewBeforeTuningStrip selectedReviewId="" onSelectReview={onSelectReview} />);

    fireEvent.click(screen.getByTestId("ask-run-id-picker"));

    expect(onSelectReview).toHaveBeenCalledWith("run-picked-1");
  });
});
