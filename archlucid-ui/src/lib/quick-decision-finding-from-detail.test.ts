import { describe, expect, it } from "vitest";

import { extractQuickDecisionFindingsFromRunDetail } from "@/lib/quick-decision-finding-from-detail";
import { FINDING_CLASSIFICATION_UNRECOGNIZED_LABEL } from "@/lib/findings/finding-classification-chip-presentation";
import { resolveFindingClassificationLabel } from "@/lib/findings/finding-classification-chip-presentation";

describe("quick-decision-finding-from-detail (P-12)", () => {
  it("preserves empty category wire values separately from omitted category", () => {
    const emptyCategory = extractQuickDecisionFindingsFromRunDetail({
      results: [{ findings: [{ findingId: "f-empty-cat", title: "Gap", message: "Fix", category: "" }] }],
    } as never);
    const omittedCategory = extractQuickDecisionFindingsFromRunDetail({
      results: [{ findings: [{ findingId: "f-no-cat", title: "Gap", message: "Fix" }] }],
    } as never);

    expect(emptyCategory[0]?.category).toBe("");
    expect(omittedCategory[0]?.category).toBeNull();
  });

  it("preserves unrecognized classification wire values for presentation", () => {
    const findings = extractQuickDecisionFindingsFromRunDetail({
      results: [
        {
          findings: [
            {
              findingId: "f-weird",
              title: "Gap",
              message: "Fix",
              classification: "LegacyGate",
            },
          ],
        },
      ],
    } as never);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.classification).toBe("LegacyGate");
    expect(resolveFindingClassificationLabel(findings[0]?.classification ?? null, null)).toBe(
      FINDING_CLASSIFICATION_UNRECOGNIZED_LABEL,
    );
  });
});
