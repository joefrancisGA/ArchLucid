import { describe, expect, it } from "vitest";

import {
  countRunDetailEvidenceInventoryItems,
  deriveEvidenceScopeCoverageLine,
  deriveEvidenceScopeReadiness,
  deriveRunDetailEvidenceInventory,
  findingsCiteEvidenceWithoutStoredSourceNames,
  FINDINGS_CITE_EVIDENCE_WITHOUT_SOURCE_NAMES_HEADLINE,
  RUN_DETAIL_EVIDENCE_KIND_NOT_STORED,
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
  it("does not invent a persisted citation row when only evidence counts are stored", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [
        finding({
          findingId: "f-count-only",
          evidenceRefCount: 2,
          evidenceRefSnippets: [],
        }),
      ],
      runCreatedUtc: "2026-08-09T12:00:00Z",
      submittedArchitecturePresent: false,
    });

    expect(items).toHaveLength(0);
  });

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
    expect(items[0]?.kind).toBe(RUN_DETAIL_EVIDENCE_KIND_NOT_STORED);
    expect(items[0]?.inventoryKind).toBe("citation");
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
    expect(items[0]?.inventoryKind).toBe("architecture-brief");
  });

  it("marks intake-attached Word files as citation when not in stored catalog", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-08-30T19:46:00Z",
      submittedArchitecturePresent: false,
      attachedFileNames: ["ARCHITECTURE_HANDBOOK.docx"],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.sourceName).toBe("ARCHITECTURE_HANDBOOK.docx");
    expect(items[0]?.kind).toBe(RUN_DETAIL_EVIDENCE_KIND_NOT_STORED);
    expect(items[0]?.inventoryKind).toBe("citation");
    expect(items[0]?.ingestedUtc).toBeNull();
    expect(items[0]?.citingFindingCount).toBe(0);
  });

  it("marks catalog-matched files as stored-file with evidenceItemId", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-08-30T19:46:00Z",
      submittedArchitecturePresent: false,
      attachedFileNames: ["ARCHITECTURE_HANDBOOK.docx"],
      storedEvidenceCatalog: [
        {
          evidenceItemId: "abc123",
          originalFileName: "ARCHITECTURE_HANDBOOK.docx",
        },
      ],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.inventoryKind).toBe("stored-file");
    expect(items[0]?.evidenceItemId).toBe("abc123");
    expect(items[0]?.ingestedUtc).toBeNull();
  });

  it("uses catalog createdUtc for ingested time on stored files when provided at derive time", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-08-30T19:46:00Z",
      submittedArchitecturePresent: false,
      attachedFileNames: ["ARCHITECTURE_HANDBOOK.docx"],
      storedEvidenceCatalog: [
        {
          evidenceItemId: "abc123",
          originalFileName: "ARCHITECTURE_HANDBOOK.docx",
          createdUtc: "2026-08-12T11:00:00Z",
        },
      ],
    });

    expect(items[0]?.ingestedUtc).toBe("2026-08-12T11:00:00Z");
  });

  it("lists intake-attached Word files even when the generated brief is hidden", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-08-30T19:46:00Z",
      submittedArchitecturePresent: false,
      attachedFileNames: ["ARCHITECTURE_HANDBOOK.docx"],
    });

    expect(items).toHaveLength(1);
    expect(items[0]?.sourceName).toBe("ARCHITECTURE_HANDBOOK.docx");
    expect(items[0]?.kind).toBe(RUN_DETAIL_EVIDENCE_KIND_NOT_STORED);
    expect(items[0]?.citingFindingCount).toBe(0);
  });

  it("detects findings that cite evidence counts without stored source names", () => {
    expect(
      findingsCiteEvidenceWithoutStoredSourceNames([
        finding({
          findingId: "f-1",
          evidenceRefCount: 2,
          evidenceRefSnippets: [],
        }),
      ]),
    ).toBe(true);

    expect(
      findingsCiteEvidenceWithoutStoredSourceNames([
        finding({
          findingId: "f-2",
          evidenceRefCount: 1,
          evidenceRefSnippets: ["policy.pdf:3 — gap"],
        }),
      ]),
    ).toBe(false);
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

  it("does not mark trust complete when inventory exists but trust rollup is absent", () => {
    const readiness = deriveEvidenceScopeReadiness({
      inventoryCount: 3,
      trustReadiness: null,
    });

    expect(readiness.verdict).toBe("gaps");
    expect(readiness.headline).toBe("Trust evidence was not stored.");
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

  it("surfaces citations-without-source-names headline when inventory is empty", () => {
    const readiness = deriveEvidenceScopeReadiness({
      inventoryCount: 0,
      trustReadiness: null,
      findingsCiteEvidenceWithoutSourceNames: true,
    });

    expect(readiness.verdict).toBe("gaps");
    expect(readiness.headline).toBe(FINDINGS_CITE_EVIDENCE_WITHOUT_SOURCE_NAMES_HEADLINE);
  });
});
