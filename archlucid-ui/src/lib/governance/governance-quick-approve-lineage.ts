import type { GovernanceLineageFindingSummary } from "@/types/governance-dashboard";

/**
 * Whether approval-request lineage findings block one-click quick approve.
 * Contract severities: `Critical`, `Error` (High in UI terms), and `High` if ever serialized that way.
 */
export function approvalLineageBlocksQuickApprove(
  topFindings: ReadonlyArray<Pick<GovernanceLineageFindingSummary, "severity">>,
): boolean {
  for (const f of topFindings) {
    const key = typeof f.severity === "string" ? f.severity.trim().toLowerCase() : "";

    if (key.length === 0) {
      continue;
    }

    if (key === "critical" || key === "error" || key === "high") {
      return true;
    }
  }

  return false;
}
