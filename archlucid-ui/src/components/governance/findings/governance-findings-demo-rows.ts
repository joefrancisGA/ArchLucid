import {
  SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

/** Buyer-polished demo rows: action text aligned to each bundled decision synopsis (indices 0–7). */
const SHOWCASE_GOVERNANCE_DECISION_RECOMMENDED: readonly string[] = [
  "Reconfirm intake stays system-of-record in the next integration review; refresh the adapter inventory.",
  "Spot-check ingress PHI classifications quarterly and tighten tagging rules when drift appears.",
  "Load-test bounded queues and back-pressure thresholds ahead of peak season; document rollback.",
  "Review capped rework-queue metrics monthly; escalate sustained overflow to supervised exception owners.",
  "Verify OCR vendor agreements and human confirm gates before expanding unstructured attachment volume.",
  "Exercise signing-key rotation and consumer idempotency in CI before major adjudication changes.",
  "Align retention attestations with enterprise records management ahead of external audits.",
  "Publish intake latency, queue depth, and exception-rate dashboards in the sponsor KPI pack.",
];

export function governanceFindingsDemoPhiRow(): GovernanceFindingQueueRow {
  return {
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    runLabel: "Claims Intake Modernization Review",
    manifestId: SHOWCASE_STATIC_DEMO_MANIFEST_ID,
    findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    title: "PHI Minimization Risk",
    severity: "High",
    category: "Privacy / regulated data",
    status: "Accepted · monitoring · non-blocking",
    recommended:
      "Review PHI handling posture with intake and security owners before production rollout; weekly exception-volume review while monitored.",
    recordKind: "finding",
    traceConfidenceLevel: "Medium",
    systemName: "Claims Intake Platform",
    resourceId:
      "/subscriptions/demo/resourceGroups/ClaimsIntakeRg/providers/Microsoft.KeyVault/vaults/claims-kv-1",
  };
}

export function staticDemoGovernanceFindingRows(): GovernanceFindingQueueRow[] {
  const phi = governanceFindingsDemoPhiRow();
  const decisionRows: GovernanceFindingQueueRow[] = SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES.slice(0, 8).map((syn, i) => ({
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    runLabel: "Claims Intake Modernization Review",
    manifestId: SHOWCASE_STATIC_DEMO_MANIFEST_ID,
    findingId: `showcase-decision-${i + 1}`,
    title: syn.length > 96 ? `${syn.slice(0, 93)}…` : syn,
    severity: "Info",
    category: "Architecture decision",
    status: "Recorded",
    recommended:
      SHOWCASE_GOVERNANCE_DECISION_RECOMMENDED[i] ??
      "Document acceptance with owning teams in the next design review.",
    recordKind: "decision",
  }));

  return [phi, ...decisionRows];
}
