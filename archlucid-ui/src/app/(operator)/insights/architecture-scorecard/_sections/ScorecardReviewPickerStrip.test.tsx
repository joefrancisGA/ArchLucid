import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "workspace-run-1", setRunId: vi.fn() }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: {
    readonly value: string;
    readonly onChange: (value: string) => void;
  }) => (
    <select
      data-testid="scorecard-review-picker-mock"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    >
      <option value="">Select…</option>
      <option value="workspace-run-1">Workspace run</option>
      <option value="other-run">Other run</option>
    </select>
  ),
}));

import { ScorecardReviewPickerStrip } from "./ScorecardReviewPickerStrip";

describe("ScorecardReviewPickerStrip", () => {
  it("auto-selects workspace active review when none is chosen", () => {
    const onSelectReview = vi.fn();

    render(<ScorecardReviewPickerStrip selectedReviewId={null} onSelectReview={onSelectReview} />);

    expect(onSelectReview).toHaveBeenCalledWith("workspace-run-1");
    expect(screen.getByTestId("scorecard-pick-review-before-metrics-strip")).toBeInTheDocument();
  });

  it("forwards manual review selection", () => {
    const onSelectReview = vi.fn();

    render(<ScorecardReviewPickerStrip selectedReviewId="workspace-run-1" onSelectReview={onSelectReview} />);

    fireEvent.change(screen.getByTestId("scorecard-review-picker-mock"), {
      target: { value: "other-run" },
    });

    expect(onSelectReview).toHaveBeenCalledWith("other-run");
  });
});
