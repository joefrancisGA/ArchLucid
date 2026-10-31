import { describe, expect, it } from "vitest";

import {
  countRunDetailEvidenceInventoryItems,
  deriveEvidenceScopeCoverageLine,
  deriveEvidenceScopeReadiness,
  deriveRunDetailEvidenceInventory,
  formatRunDetailEvidenceCitingFindingCount,
  formatRunDetailEvidenceSourceNameDisplay,
  findingsCiteEvidenceWithoutStoredSourceNames,
  FINDINGS_CITE_EVIDENCE_WITHOUT_SOURCE_NAMES_HEADLINE,
  RUN_DETAIL_EVIDENCE_KIND_NOT_STORED,
  RUN_DETAIL_EVIDENCE_SOURCE_NAME_NOT_STORED,
  RUN_DETAIL_EVIDENCE_SOURCE_NAME_STORED_EMPTY,
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
  it("formatRunDetailEvidenceSourceNameDisplay distinguishes not stored from stored empty", () => {
    expect(formatRunDetailEvidenceSourceNameDisplay(RUN_DETAIL_EVIDENCE_SOURCE_NAME_NOT_STORED)).toBe(
      RUN_DETAIL_EVIDENCE_SOURCE_NAME_NOT_STORED,
    );
    expect(formatRunDetailEvidenceSourceNameDisplay("   ")).toBe(RUN_DETAIL_EVIDENCE_SOURCE_NAME_STORED_EMPTY);
    expect(formatRunDetailEvidenceSourceNameDisplay("policy.pdf")).toBe("policy.pdf");
  });

  it("withholds citing finding counts when findings snapshot was not stored (P-09)", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-08-09T12:00:00Z",
      submittedArchitecturePresent: false,
      attachedFileNames: ["policy.pdf"],
      hasFindingsSnapshot: false,
    });

    expect(items[0]?.citingFindingCountStored).toBe(false);
    expect(
      formatRunDetailEvidenceCitingFindingCount(items[0]?.citingFindingCount ?? 0, items[0]?.citingFindingCountStored ?? false),
    ).toBe("Citing finding count was not stored.");
  });

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

  it("does not copy run created time onto inventory ingested column (P-01)", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-01-01T00:00:00Z",
      submittedArchitecturePresent: false,
      attachedFileNames: ["policy.pdf"],
    });

    expect(items[0]?.ingestedUtc).toBeNull();
  });

  it("uses stored catalog content type for cited file names (P-02)", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [
        finding({
          findingId: "f-1",
          evidenceRefSnippets: ["policy.pdf:3 — gap"],
        }),
      ],
      runCreatedUtc: "2026-08-09T12:00:00Z",
      submittedArchitecturePresent: false,
      storedEvidenceCatalog: [
        {
          evidenceItemId: "ev-1",
          originalFileName: "policy.pdf",
          contentType: "application/pdf",
        },
      ],
      hasFindingsSnapshot: true,
    });

    expect(items[0]?.kind).toBe("application/pdf");
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

  it("does not infer evidence kind from inventory-like filenames", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-08-09T12:00:00Z",
      submittedArchitecturePresent: false,
      attachedFileNames: ["notes.zip", "inventory-brief.pdf"],
    });

    expect(items.map((item) => item.kind)).toEqual([
      RUN_DETAIL_EVIDENCE_KIND_NOT_STORED,
      RUN_DETAIL_EVIDENCE_KIND_NOT_STORED,
    ]);
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

  it("does not treat null evidenceRefCount as citing evidence without source names (P-08)", () => {
    expect(
      findingsCiteEvidenceWithoutStoredSourceNames([
        finding({
          findingId: "f-null-count",
          evidenceRefCount: null,
          evidenceRefSnippets: [],
        }),
      ]),
    ).toBe(false);
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

  it("uses not-stored and stored-empty coverage lines when inventory is empty", () => {
    expect(
      deriveEvidenceScopeCoverageLine({
        inventoryCount: 0,
        findingsCoverageSummaryLine: "",
        linkedFindingCount: 0,
        openFindingCount: 0,
        findingsSnapshotStored: false,
      }),
    ).toBe("Submitted evidence list was not stored.");

    expect(
      deriveEvidenceScopeCoverageLine({
        inventoryCount: 0,
        findingsCoverageSummaryLine: "",
        linkedFindingCount: 0,
        openFindingCount: 0,
        findingsSnapshotStored: true,
      }),
    ).toBe("Submitted source list was stored empty.");
  });

  it("replaces findings coverage copy when inventory is empty but findings cite pointers", () => {
    const line = deriveEvidenceScopeCoverageLine({
      inventoryCount: 0,
      findingsCoverageSummaryLine: "1 of 1 open finding has linked evidence",
      linkedFindingCount: 1,
      openFindingCount: 1,
    });

    expect(line).toContain("submitted source names were not stored");
    expect(line).not.toContain("internal finding pointers");
  });

  it("pluralizes empty-inventory coverage copy from linked finding count", () => {
    const line = deriveEvidenceScopeCoverageLine({
      inventoryCount: 0,
      findingsCoverageSummaryLine: "2 of 3 open findings have linked evidence",
      linkedFindingCount: 2,
      openFindingCount: 3,
    });

    expect(line).toBe(
      "2 open findings with evidence references recorded — submitted source names were not stored.",
    );
  });

  it("labels architecture brief citing count as not stored when zero (P-01)", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-08-09T12:00:00Z",
      submittedArchitecturePresent: true,
      hasFindingsSnapshot: true,
    });

    const brief = items.find((item) => item.inventoryKind === "architecture-brief");

    expect(brief).toBeDefined();
    expect(
      formatRunDetailEvidenceCitingFindingCount(
        brief!.citingFindingCount,
        brief!.citingFindingCountStored,
        brief!.inventoryKind,
      ),
    ).toBe("Citing finding count was not stored for the architecture brief.");
  });

  it("does not treat citation prose as a stored source name (P-02)", () => {
    const items = deriveRunDetailEvidenceInventory({
      findings: [
        finding({
          findingId: "f-1",
          evidenceRefSnippets: ["Tokens live in Key Vault — see notes"],
        }),
      ],
      runCreatedUtc: "2026-08-09T12:00:00Z",
      submittedArchitecturePresent: false,
      hasFindingsSnapshot: true,
    });

    expect(items[0]?.sourceName).toBe("Source name was not stored.");
  });

  it("uses not-stored headline when findings snapshot was omitted (P-20)", () => {
    const readiness = deriveEvidenceScopeReadiness({
      inventoryCount: 0,
      trustReadiness: null,
      findingsSnapshotStored: false,
    });

    expect(readiness.headline).toBe("Submitted evidence list was not stored.");
    expect(readiness.headline).not.toContain("empty");
  });

  it("does not mark trust complete when inventory exists but trust rollup is absent", () => {
    const readiness = deriveEvidenceScopeReadiness({
      inventoryCount: 3,
      trustReadiness: null,
    });

    expect(readiness.verdict).toBe("gaps");
    expect(readiness.headline).toBe("Trust evidence was not stored.");
  });

  it("keeps stored trust verdict when inventory is empty and adds empty-list copy", () => {
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

    expect(readiness.verdict).toBe("complete");
    expect(readiness.headline).toContain("Evidence is complete for sponsor handoff.");
    expect(readiness.headline).toContain("Submitted evidence inventory is empty.");
  });

  it("labels zip and bicep attached files without filename inference (P-03)", () => {
    const zipItem = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-08-09T12:00:00Z",
      submittedArchitecturePresent: false,
      attachedFileNames: ["bundle.zip"],
    })[0];
    const bicepItem = deriveRunDetailEvidenceInventory({
      findings: [],
      runCreatedUtc: "2026-08-09T12:00:00Z",
      submittedArchitecturePresent: false,
      attachedFileNames: ["main.bicep"],
    })[0];

    expect(zipItem?.kind).toBe(RUN_DETAIL_EVIDENCE_KIND_NOT_STORED);
    expect(bicepItem?.kind).toBe(RUN_DETAIL_EVIDENCE_KIND_NOT_STORED);
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

  it("surfaces citations-without-source-names headline when inventory rows exist (P-19)", () => {
    const readiness = deriveEvidenceScopeReadiness({
      inventoryCount: 2,
      trustReadiness: {
        verdict: "complete",
        headline: "Evidence is complete for sponsor handoff.",
        readyCount: 2,
        totalCount: 2,
        exceptions: [],
        satisfied: [],
      },
      findingsCiteEvidenceWithoutSourceNames: true,
    });

    expect(readiness.verdict).toBe("gaps");
    expect(readiness.headline).toBe(FINDINGS_CITE_EVIDENCE_WITHOUT_SOURCE_NAMES_HEADLINE);
  });
});
