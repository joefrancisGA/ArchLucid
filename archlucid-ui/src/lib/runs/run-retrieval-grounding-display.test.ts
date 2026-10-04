import { describe, expect, it } from "vitest";

import {
  formatRunRetrievalCitationCoverage,
  formatRunRetrievalGroundingScoresLabel,
} from "@/lib/runs/run-retrieval-grounding-display";

describe("run-retrieval-grounding-display", () => {
  it("labels missing coverage as not recorded", () => {
    expect(formatRunRetrievalCitationCoverage(null)).toBe("Not recorded");
  });

  it("labels empty scores as not scored", () => {
    expect(formatRunRetrievalGroundingScoresLabel(false, [])).toBe("Not scored");
  });
});
