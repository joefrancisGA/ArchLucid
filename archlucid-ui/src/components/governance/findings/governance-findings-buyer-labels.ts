import { formatGovernanceQueueRecordKind, type GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";

/** Maps governance queue disposition strings to canonical enterprise status tags. */
export function governanceQueueStatusTagKind(status: string): EnterpriseStatusKind {
  const normalized = status.trim().toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("resolved") ||
    normalized.includes("closed") ||
    normalized.includes("accepted")
  ) {
    return "ready";
  }

  if (normalized.includes("rejected") || normalized.includes("failed") || normalized.includes("blocked")) {
    return "blocked";
  }

  if (normalized.includes("submitted") || normalized.includes("review") || normalized.includes("progress")) {
    return "in-progress";
  }

  if (normalized.includes("open") || normalized.includes("pending") || normalized.includes("stale")) {
    return "needs-attention";
  }

  return "neutral";
}

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
