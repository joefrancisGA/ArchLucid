import type { AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";

/** Workbook fixture IDs for COO / GOO al-ui-rate screenshots (local dev without API seed). */
export const WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS = {
  assessmentId: "assessment-1",
  snapshotId: "snapshot-1",
  controlId: "control-1",
} as const;

const WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_RECORD: AuditEvidenceLineageRecord = {
  assessmentId: WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS.assessmentId,
  auditEvidenceSnapshotId: WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS.snapshotId,
  controlId: WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS.controlId,
  controlNumber: "AC-2",
  controlTitle: "Account management",
  chainComplete: true,
  snapshotHashVerified: true,
  readyForPositiveCheckbox: true,
  brokenLinkReasons: [],
  evaluation: {
    evaluationId: "eval-workbook-demo-1",
    outcome: "TechnicallySupported",
    formula: "2/2 requirements satisfied",
    provenanceKind: "deterministic",
  },
  requirementChains: [
    {
      requirementId: "req-network-egress",
      requirementName: "Network egress evidence",
      evidenceType: "Network",
      evidence: [
        {
          evidenceRowId: "ev-workbook-1",
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
          azureResourceId:
            "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
          linkComplete: true,
          itemHashVerified: true,
          missingLinkKinds: [],
          collectedUtc: "2026-01-15T12:00:00Z",
          collectorVersion: "infra-evidence-collector/1.4.0",
          selectorVersion: "network-egress/2.1",
        },
      ],
    },
    {
      requirementId: "req-config-baseline",
      requirementName: "Configuration baseline",
      evidenceType: "Configuration",
      evidence: [
        {
          evidenceRowId: "ev-workbook-2",
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
          linkComplete: true,
          itemHashVerified: true,
          missingLinkKinds: [],
          collectedUtc: "2026-01-15T12:05:00Z",
          collectorVersion: "infra-evidence-collector/1.4.0",
          selectorVersion: "config-baseline/1.0",
        },
      ],
    },
  ],
};

export function tryWorkbookAuditEvidenceLineageDemoFallback(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): AuditEvidenceLineageRecord | null {
  if (
    assessmentId.trim() === WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS.assessmentId
    && snapshotId.trim() === WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS.snapshotId
    && controlId.trim() === WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_IDS.controlId
  ) {
    return WORKBOOK_AUDIT_EVIDENCE_LINEAGE_DEMO_RECORD;
  }

  return null;
}
