import { describe, expect, it } from "vitest";

import {
  formatRetrievalGroundingRatioPercent,
  resolveRetrievalGroundingDispositionPresentation,
} from "@/lib/runs/run-retrieval-grounding-summary-display";

describe("run-retrieval-grounding-summary-display", () => {
  it("does not coerce missing citation coverage to 0%", () => {
    expect(formatRetrievalGroundingRatioPercent(undefined)).toBe("Average citation coverage was not stored.");
  });

  it("normalizes 0–1 and 0–100 ratios", () => {
    expect(formatRetrievalGroundingRatioPercent(0.42)).toBe("42%");
    expect(formatRetrievalGroundingRatioPercent(42)).toBe("42%");
  });

  it("parses numeric strings and ignores non-numeric strings", () => {
    expect(formatRetrievalGroundingRatioPercent("0.42")).toBe("42%");
    expect(formatRetrievalGroundingRatioPercent("not-a-ratio")).toBe("Average citation coverage was not stored.");
  });

  it("does not default missing disposition to WARN", () => {
    expect(resolveRetrievalGroundingDispositionPresentation(null).titleSuffix).toBe(
      "Disposition not returned",
    );
  });
});
