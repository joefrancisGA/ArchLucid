import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertSimulationPickReviewBeforeSimulatingStrip } from "./AlertSimulationPickReviewBeforeSimulatingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-sim-1", setActiveRunId: () => undefined }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string; onChange: (value: string) => void }) => (
    <button type="button" data-testid="ask-run-id-picker" onClick={() => props.onChange("run-picked-1")}>
      {props.value}
    </button>
  ),
}));

describe("AlertSimulationPickReviewBeforeSimulatingStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <AlertSimulationPickReviewBeforeSimulatingStrip selectedReviewId="" onSelectReview={() => undefined} />,
    );

    expect(screen.getByTestId("alert-simulation-pick-review-before-simulating-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before simulating/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-sim-1");
  });

  it("forwards a picked review without auto-selecting workspace", () => {
    const onSelectReview = vi.fn();
    render(
      <AlertSimulationPickReviewBeforeSimulatingStrip selectedReviewId="" onSelectReview={onSelectReview} />,
    );

    expect(onSelectReview).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("ask-run-id-picker"));

    expect(onSelectReview).toHaveBeenCalledWith("run-picked-1");
  });
});
