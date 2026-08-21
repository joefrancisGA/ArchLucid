import { describe, expect, it } from "vitest";

import { buildFindingsDerivedClarificationGaps } from "@/lib/architecture/build-findings-derived-clarification-gaps";

describe("buildFindingsDerivedClarificationGaps", () => {
  it("maps findings-derived questions to clarification gaps", () => {
    const gaps = buildFindingsDerivedClarificationGaps({
      runId: "run-1",
      correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
      source: { label: "From your brief", capturedAtLabel: null },
      questions: [
        {
          questionId: "q1",
          prompt: "How is encryption handled?",
          sourceFindingId: "f1",
          sourceFindingType: "SecurityCoverageFinding",
          severity: "Warning",
          missingItem: "storage-account-1",
        },
      ],
    });

    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.id).toBe("q1");
    expect(gaps[0]?.source.label).toBe("From assessment findings");
  });
});
