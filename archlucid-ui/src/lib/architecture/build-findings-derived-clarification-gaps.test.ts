import { describe, expect, it } from "vitest";

import { buildFindingsDerivedClarificationGaps } from "@/lib/architecture/build-findings-derived-clarification-gaps";

describe("buildFindingsDerivedClarificationGaps (P-12)", () => {
  it("labels omitted question prompt without inventing text", () => {
    const gaps = buildFindingsDerivedClarificationGaps({
      runId: "run-1",
      clarificationPriorRunId: null,
      gapSourceCapturedAtUtc: null,
      questions: [
        {
          questionId: "q-1",
          prompt: "   ",
          sourceFindingId: "f-1",
          sourceFindingType: "PolicyCoverageFinding",
          severity: "Warning",
          missingItem: "item-a",
        },
      ],
    });

    expect(gaps[0]?.label).toBe("Clarification question was not stored.");
  });
});
