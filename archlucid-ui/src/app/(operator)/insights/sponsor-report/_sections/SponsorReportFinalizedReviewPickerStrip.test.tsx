import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SponsorReportFinalizedReviewPickerStrip } from "./SponsorReportFinalizedReviewPickerStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-finalized-1", displayTitle: "Q1 review" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("SponsorReportFinalizedReviewPickerStrip", () => {
  it("renders when finalized reviews exist", () => {
    render(<SponsorReportFinalizedReviewPickerStrip hasFinalizedReviews />);

    expect(screen.getByTestId("sponsor-report-finalized-review-picker-strip")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-report-finalized-review-open")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-finalized-1",
    );
  });

  it("hides when no finalized reviews exist", () => {
    render(<SponsorReportFinalizedReviewPickerStrip hasFinalizedReviews={false} />);

    expect(screen.queryByTestId("sponsor-report-finalized-review-picker-strip")).not.toBeInTheDocument();
  });
});
