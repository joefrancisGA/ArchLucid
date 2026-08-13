import { beforeEach, describe, expect, it, vi } from "vitest";

import { cancelOperation } from "@/lib/api/operations-api";
import { patchInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { reviewPipelineOperationId } from "@/lib/operations/review-pipeline-in-flight";
import { requestReviewPipelineStopAnalysis } from "@/lib/operations/review-pipeline-stop-analysis";

vi.mock("@/lib/api/operations-api", () => ({
  cancelOperation: vi.fn(),
}));

vi.mock("@/lib/operations/in-flight-operations-store", () => ({
  patchInFlightOperation: vi.fn(),
}));

describe("requestReviewPipelineStopAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cancelOperation).mockResolvedValue(undefined);
  });

  it("requests cooperative cancel for the review pipeline operation", async () => {
    await requestReviewPipelineStopAnalysis("run-42");

    const operationId = reviewPipelineOperationId("run-42");

    expect(cancelOperation).toHaveBeenCalledWith(operationId);
    expect(patchInFlightOperation).toHaveBeenCalledWith(operationId, {
      state: "CancelRequested",
      stepLabel: "Cancel requested",
    });
  });

  it("no-ops for blank run ids", async () => {
    await requestReviewPipelineStopAnalysis("   ");

    expect(cancelOperation).not.toHaveBeenCalled();
    expect(patchInFlightOperation).not.toHaveBeenCalled();
  });
});
