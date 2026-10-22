import { describe, expect, it } from "vitest";

import {
  IMPACT_PREVIEW_LAST_BASELINE_PAIR_STORAGE_KEY,
  readImpactPreviewLastBaselinePair,
  writeImpactPreviewLastBaselinePair,
} from "@/lib/impact-preview/impact-preview-last-baseline-pair-storage";

describe("impact-preview-last-baseline-pair-storage", () => {
  it("round-trips a baseline and candidate pair", () => {
    window.localStorage.removeItem(IMPACT_PREVIEW_LAST_BASELINE_PAIR_STORAGE_KEY);
    writeImpactPreviewLastBaselinePair({
      baselineRunId: "run-baseline",
      candidateRunId: "candidate-1",
    });

    expect(readImpactPreviewLastBaselinePair()).toEqual({
      baselineRunId: "run-baseline",
      candidateRunId: "candidate-1",
    });
  });
});
