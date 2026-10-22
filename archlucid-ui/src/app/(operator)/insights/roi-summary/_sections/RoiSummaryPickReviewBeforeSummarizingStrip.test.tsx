import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RoiSummaryPickReviewBeforeSummarizingStrip } from "./RoiSummaryPickReviewBeforeSummarizingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-roi-1", displayTitle: "Claims review" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("RoiSummaryPickReviewBeforeSummarizingStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <RoiSummaryPickReviewBeforeSummarizingStrip selectedReviewId="" onSelectReview={() => undefined} />,
    );

    expect(screen.getByTestId("roi-summary-pick-review-before-summarizing-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before summarizing ROI/)).toBeInTheDocument();
  });
});
