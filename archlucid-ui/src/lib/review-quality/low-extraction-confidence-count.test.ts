import { describe, expect, it } from "vitest";

import { resolveLowExtractionConfidenceCount } from "@/lib/review-quality/low-extraction-confidence-count";

describe("resolveLowExtractionConfidenceCount", () => {
  it("marks undefined counts as unknown", () => {
    expect(resolveLowExtractionConfidenceCount(undefined).known).toBe(false);
    expect(resolveLowExtractionConfidenceCount(2).known).toBe(true);
  });
});
