import { formatGovernanceQueueRecordKind, type GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";

export function governanceBuyerRecordTypePrimary(row: GovernanceFindingQueueRow): string {
  if (row.recordKind === "finding" && row.findingId === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID) {
    return "Risk finding";
  }

  return formatGovernanceQueueRecordKind(row.recordKind, true);
}

export function governanceBuyerRecordTypeSecondary(row: GovernanceFindingQueueRow): string | null {
  if (row.recordKind === "finding" && row.findingId === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID) {
    return "Risk area: PHI minimization · Disposition: Accepted with monitoring";
  }

  return null;
}
