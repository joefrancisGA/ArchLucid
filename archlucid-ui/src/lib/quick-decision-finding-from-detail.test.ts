import { describe, expect, it } from "vitest";

import { extractQuickDecisionFindingsFromRunDetail } from "@/lib/quick-decision-finding-from-detail";
import { FINDING_CLASSIFICATION_UNRECOGNIZED_LABEL } from "@/lib/findings/finding-classification-chip-presentation";
import { resolveFindingClassificationLabel } from "@/lib/findings/finding-classification-chip-presentation";

describe("quick-decision-finding-from-detail (P-12)", () => {
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
