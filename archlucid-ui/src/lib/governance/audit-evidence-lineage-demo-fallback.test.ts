import { describe, expect, it } from "vitest";

import {
  WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS,
  tryWorkbookAuditEvidenceLineageDemoFallback,
} from "@/lib/governance/audit-evidence-lineage-demo-fallback";

describe("audit-evidence-lineage-demo-fallback", () => {
  it("returns curated lineage for workbook fixture ids", () => {
    const record = tryWorkbookAuditEvidenceLineageDemoFallback(
      WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS.assessmentId,
      WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS.snapshotId,
      WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS.controlId,
    );

    expect(record).not.toBeNull();
    expect(record?.controlNumber).toBe("AC-2");
    expect(record?.requirementChains).toHaveLength(2);
    expect(record?.readyForPositiveCheckbox).toBe(true);
  });

  it("returns null for unrelated ids", () => {
    expect(tryWorkbookAuditEvidenceLineageDemoFallback("other", "other", "other")).toBeNull();
  });
});
