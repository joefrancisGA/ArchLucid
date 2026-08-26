import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImpactPreviewPickReviewBeforeSimulatingStrip } from "./ImpactPreviewPickReviewBeforeSimulatingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-preview-1", runId: "run-preview-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("ImpactPreviewPickReviewBeforeSimulatingStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <ImpactPreviewPickReviewBeforeSimulatingStrip selectedReviewId="" onSelectReview={() => undefined} />,
    );

    expect(screen.getByTestId("impact-preview-pick-review-before-simulating-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before simulating/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-preview-1");
  });
});
