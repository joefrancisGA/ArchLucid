import { describe, expect, it } from "vitest";

import {
  countRunDetailEvidenceInventoryItems,
  deriveRunDetailEvidenceInventory,
} from "@/lib/run-detail-evidence-inventory";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function finding(partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">): QuickDecisionFinding {
  return {
    title: "Finding",
    recommendation: "Fix it",
    severityValue: 1,
    findingOrder: 1,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "blocking",
    ...partial,
  };
}

describe("run-detail-evidence-inventory", () => {
  it("groups cited snippets and counts citing findings", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [
        finding({
          findingId: "f-1",
          evidenceRefSnippets: ["storageAccount.bicep:42 — encryption disabled"],
        }),
        finding({
          findingId: "f-2",
          evidenceRefSnippets: ["storageAccount.bicep:88 — public access"],
        }),
      ],
      runCreatedUtc: "2026-08-09T12:00:00Z",
      submittedArchitecturePresent: false,
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.sourceName).toBe("storageAccount.bicep");
    expect(items[0]?.citingFindingCount).toBe(2);
    expect(countRunDetailEvidenceInventoryItems(items)).toBe(1);
  });

  it("includes submitted architecture brief as an inventory row", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-08-09T12:00:00Z",
      submittedArchitecturePresent: true,
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe("Architecture brief");
  });
});
