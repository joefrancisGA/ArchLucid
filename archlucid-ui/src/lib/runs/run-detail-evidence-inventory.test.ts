import { describe, expect, it } from "vitest";

import {
  countRunDetailEvidenceInventoryItems,
  deriveEvidenceScopeCoverageLine,
  deriveEvidenceScopeReadiness,
  deriveRunDetailEvidenceInventory,
} from "@/lib/runs/run-detail-evidence-inventory";
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

  it("replaces findings coverage copy when inventory is empty but findings cite pointers", () => {
    const line = deriveEvidenceScopeCoverageLine({
      inventoryCount: 0,
      findingsCoverageSummaryLine: "1 of 1 open finding has linked evidence",
      linkedFindingCount: 1,
      openFindingCount: 1,
    });

    expect(line).toContain("internal finding pointers");
    expect(line).not.toContain("linked evidence");
  });

  it("pluralizes empty-inventory coverage copy from linked finding count", () => {
    const line = deriveEvidenceScopeCoverageLine({
      inventoryCount: 0,
      findingsCoverageSummaryLine: "2 of 3 open findings have linked evidence",
      linkedFindingCount: 2,
      openFindingCount: 3,
    });

    expect(line).toBe(
      "2 open findings cite internal finding pointers — no submitted source documents are listed.",
    );
  });

  it("forces gaps readiness when inventory is empty", () => {
    const readiness = deriveEvidenceScopeReadiness({
      inventoryCount: 0,
      trustReadiness: {
        verdict: "complete",
        headline: "Evidence is complete for sponsor handoff.",
        readyCount: 8,
        totalCount: 8,
        exceptions: [],
        satisfied: [],
      },
    });

    expect(readiness.verdict).toBe("gaps");
    expect(readiness.headline).toBe("Submitted evidence inventory is empty.");
  });
});
