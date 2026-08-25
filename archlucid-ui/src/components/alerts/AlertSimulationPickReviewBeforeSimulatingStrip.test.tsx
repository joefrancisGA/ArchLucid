import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertSimulationPickReviewBeforeSimulatingStrip } from "./AlertSimulationPickReviewBeforeSimulatingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-sim-1", setActiveRunId: () => undefined }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
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
});
