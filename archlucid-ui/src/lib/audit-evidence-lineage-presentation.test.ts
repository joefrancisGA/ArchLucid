import { describe, expect, it } from "vitest";

import {
  auditEvaluationOutcomeStatusKind,
  collectBrokenEvidenceLinkKinds,
  countAuditEvidenceLineageSummary,
  countEvidenceHashVerification,
  deriveAuditLineageCheckboxPresentation,
  formatAuditLineageEvaluationContext,
  formatEvidenceHashVerificationSummary,
  humanizeAuditEvidenceLinkKind,
  resolveLatestCollectedUtc,
} from "@/lib/audit-evidence-lineage-presentation";
import type { AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";

describe("audit-evidence-lineage-presentation", () => {
  it("maps evaluation outcomes to status kinds", () => {
    expect(auditEvaluationOutcomeStatusKind("TechnicallySupported")).toBe("ready");
    expect(auditEvaluationOutcomeStatusKind("TechnicallyNotSupported")).toBe("blocked");
    expect(auditEvaluationOutcomeStatusKind("InsufficientEvidence")).toBe("needs-attention");
  });

  it("humanizes missing link enum labels", () => {
    expect(humanizeAuditEvidenceLinkKind("RawApiBlob")).toBe("Raw API blob");
  });

  it("counts requirements and evidence rows for collapsed summaries", () => {
    const lineage: AuditEvidenceLineageRecord = {
      requirementChains: [
        { requirementId: "req-1", evidence: [{ evidenceRowId: "ev-1" }, { evidenceRowId: "ev-2" }] },
        { requirementId: "req-2", evidence: [] },
      ],
    };

    expect(countAuditEvidenceLineageSummary(lineage)).toEqual({
      requirementCount: 2,
      evidenceCount: 2,
    });
  });

  it("collects broken evidence link kinds", () => {
    const lineage: AuditEvidenceLineageRecord = {
      requirementChains: [
        {
          requirementId: "req-1",
          evidence: [
            {
              evidenceRowId: "ev-1",
              linkComplete: false,
              itemHashVerified: false,
              missingLinkKinds: ["RawApiBlob"],
            },
          ],
        },
      ],
    };

    expect(collectBrokenEvidenceLinkKinds(lineage)).toEqual(["RawApiBlob", "EvidenceHash", "LinkIncomplete"]);
  });

  it("counts verified evidence hashes and formats collapsed hash summaries", () => {
    const lineage: AuditEvidenceLineageRecord = {
      requirementChains: [
        {
          requirementId: "req-1",
          evidence: [
            { evidenceRowId: "ev-1", itemHashVerified: true },
            { evidenceRowId: "ev-2", itemHashVerified: false },
          ],
        },
      ],
    };

    expect(countEvidenceHashVerification(lineage)).toEqual({ verifiedCount: 1, totalCount: 2 });
    expect(formatEvidenceHashVerificationSummary(lineage)).toBe("1/2 evidence hashes verified");
    expect(formatEvidenceHashVerificationSummary({ requirementChains: [] })).toBe(
      "No evidence rows to verify in this snapshot",
    );
  });

  it("resolves the latest collectedUtc across evidence rows", () => {
    const lineage: AuditEvidenceLineageRecord = {
      requirementChains: [
        {
          requirementId: "req-1",
          evidence: [
            { evidenceRowId: "ev-1", collectedUtc: "2026-01-01T10:00:00Z" },
            { evidenceRowId: "ev-2", collectedUtc: "2026-02-01T10:00:00Z" },
          ],
        },
      ],
    };

    expect(resolveLatestCollectedUtc(lineage)).toBe("2026-02-01T10:00:00Z");
    expect(resolveLatestCollectedUtc({ requirementChains: [] })).toBeNull();
  });

  it("formats evaluation context with outcome and latest collection time", () => {
    const lineage: AuditEvidenceLineageRecord = {
      evaluation: { outcome: "TechnicallySupported" },
      requirementChains: [
        {
          requirementId: "req-1",
          evidence: [{ evidenceRowId: "ev-1", collectedUtc: "2026-02-01T10:00:00Z" }],
        },
      ],
    };

    expect(formatAuditLineageEvaluationContext(lineage)).toContain("Technically supported");
    expect(formatAuditLineageEvaluationContext(lineage)).toContain("Latest evidence collected");
    expect(formatAuditLineageEvaluationContext({ requirementChains: [] })).toContain(
      "no collected evidence timestamps in this snapshot",
    );
  });

  it("uses downstream attestation wording for supported controls", () => {
    const presentation = deriveAuditLineageCheckboxPresentation({
      readyForPositiveCheckbox: true,
      brokenLinkReasons: [],
    });

    expect(presentation.detail).toContain("downstream attestation");
    expect(presentation.detail).not.toContain("positive checkbox");
  });
});
