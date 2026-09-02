import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewPipelineStopAnalysisButton } from "@/components/runs/ReviewPipelineStopAnalysisButton";

const requestReviewPipelineStopAnalysis = vi.fn();

vi.mock("@/lib/operations/review-pipeline-stop-analysis", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operations/review-pipeline-stop-analysis")>();

  return {
    ...actual,
    requestReviewPipelineStopAnalysis: (...args: unknown[]) => requestReviewPipelineStopAnalysis(...args),
  };
});

vi.mock("@/lib/await-minimum-visible-duration", () => ({
  awaitMinimumVisibleDuration: vi.fn(async () => undefined),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

describe("ReviewPipelineStopAnalysisButton", () => {
  beforeEach(() => {
    requestReviewPipelineStopAnalysis.mockReset();
    requestReviewPipelineStopAnalysis.mockResolvedValue(undefined);
  });

  it("shows a durable outcome after stop analysis is requested", async () => {
    render(<ReviewPipelineStopAnalysisButton runId="run-1" />);

    fireEvent.click(screen.getByTestId("review-pipeline-stop-analysis"));

    await waitFor(() => {
      expect(requestReviewPipelineStopAnalysis).toHaveBeenCalledWith("run-1");
      expect(screen.getByTestId("review-pipeline-stop-analysis-outcome")).toHaveTextContent(
        "Stop analysis requested",
      );
    });
  });
});
