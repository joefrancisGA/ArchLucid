import { describe, expect, it } from "vitest";

import { buildFindingsDerivedClarificationGaps } from "@/lib/architecture/build-findings-derived-clarification-gaps";

describe("buildFindingsDerivedClarificationGaps", () => {
  it("maps findings-derived questions to clarification gaps with follow-up hrefs", () => {
    const gaps = buildFindingsDerivedClarificationGaps({
      runId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      clarificationPriorRunId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      gapSourceCapturedAtUtc: null,
      questions: [
        {
          questionId: "abc123def4567890",
          prompt: "Which system covers Compute?",
          sourceFindingId: "finding-1",
          sourceFindingType: "TopologyCoverageFinding",
          severity: "Warning",
          missingItem: "Compute",
        },
      ],
    });

    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.source.label).toBe("From assessment findings");
    expect(gaps[0]?.href).toContain("rerun=");
    expect(gaps[0]?.href).toContain("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  });
});
