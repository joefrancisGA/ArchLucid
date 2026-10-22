import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GraphPickReviewBeforeCanvasStrip } from "./GraphPickReviewBeforeCanvasStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-graph-1", displayTitle: "Network review" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("GraphPickReviewBeforeCanvasStrip", () => {
  it("renders review picker guidance", () => {
    render(<GraphPickReviewBeforeCanvasStrip selectedReviewId="" onSelectReview={() => undefined} />);

    expect(screen.getByTestId("graph-pick-review-before-canvas-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before opening the graph/)).toBeInTheDocument();
  });
});
