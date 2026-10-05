import { describe, expect, it } from "vitest";

import {
  formatRunRetrievalCitationCoverage,
  formatRunRetrievalGroundingScoresLabel,
} from "@/lib/runs/run-retrieval-grounding-display";

describe("run-retrieval-grounding-display", () => {
  it("labels missing coverage as not recorded", () => {
    expect(formatRunRetrievalCitationCoverage(null)).toBe("Not recorded");
  });

  it("normalizes 0–1 and 0–100 citation coverage", () => {
    expect(formatRunRetrievalCitationCoverage(0.42)).toBe("42%");
    expect(formatRunRetrievalCitationCoverage(42)).toBe("42%");
  });

  it("labels empty scores as not scored", () => {
    expect(formatRunRetrievalGroundingScoresLabel(false, [])).toBe("Not scored");
  });
});
