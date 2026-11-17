import { describe, expect, it } from "vitest";

import {
  formatRunRetrievalCitationCoverage,
  formatRunRetrievalGroundingScoresLabel,
} from "@/lib/runs/run-retrieval-grounding-display";

describe("run-retrieval-grounding-display", () => {
  it("labels missing coverage as not recorded", () => {
    expect(formatRunRetrievalCitationCoverage(null)).toBe("Citation coverage was not stored.");
  });

  it("normalizes 0–1 and 0–100 citation coverage", () => {
    expect(formatRunRetrievalCitationCoverage(0.42)).toBe("42%");
    expect(formatRunRetrievalCitationCoverage(42)).toBe("42%");
  });

  it("labels empty scores as not stored", () => {
    expect(formatRunRetrievalGroundingScoresLabel(false, [])).toBe("Scores were not stored.");
  });

  it("labels malformed score metadata with a readable sentence", () => {
    expect(formatRunRetrievalGroundingScoresLabel(true, [])).toBe("Score metadata could not be parsed.");
  });

  it("labels optional scores without requiring the score field", () => {
    expect(formatRunRetrievalGroundingScoresLabel(false, [{ chunkId: "chunk-1" }])).toBe(
      "chunk-1: Score was not stored.",
    );
  });
});
