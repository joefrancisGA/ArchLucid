import { describe, expect, it } from "vitest";

import {
  auditEvaluationOutcomeLabel,
  collectBrokenEvidenceLinkKinds,
  deriveAuditLineageCheckboxPresentation,
} from "@/lib/audit-evidence-lineage-presentation";
import type { AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";

describe("audit-evidence-lineage-presentation", () => {
  it("labels technically supported outcome", () => {
    expect(auditEvaluationOutcomeLabel("TechnicallySupported")).toBe("Technically supported");
  });

  it("marks ready checkbox when chain is complete", () => {
    const lineage: AuditEvidenceLineageRecord = {
      readyForPositiveCheckbox: true,
      brokenLinkReasons: [],
      requirementChains: [],
    };

    expect(deriveAuditLineageCheckboxPresentation(lineage).kind).toBe("ready");
  });

  it("collects missing link kinds from evidence nodes", () => {
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
