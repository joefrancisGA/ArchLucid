import { describe, expect, it } from "vitest";

import {
  auditEvaluationOutcomeStatusKind,
  collectBrokenEvidenceLinkKinds,
  countAuditEvidenceLineageSummary,
  humanizeAuditEvidenceLinkKind,
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
});
