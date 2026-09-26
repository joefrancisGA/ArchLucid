import type { RemediationInstanceSummary } from "@/lib/infra-evidence/infra-evidence-remediation-types";
import type { SecurityEvidencePathDetail, SecurityEvidencePathRankDetail } from "@/lib/security-evidence-path-types";

export type PathDecisionReadiness = {
  readonly status: "READY_FOR_REVIEW" | "VERIFY_EVIDENCE";
  readonly issues: readonly string[];
  readonly affectedAssetIds: readonly string[];
  readonly verificationStatus: string;
};

/** Distinguishes observed evidence from inferred paths before remediation handoff. */
export function buildPathDecisionReadiness(
  path: SecurityEvidencePathDetail,
  rank: SecurityEvidencePathRankDetail | null,
  instance: RemediationInstanceSummary | null,
): PathDecisionReadiness {
  const issues: string[] = [];
  if (path.hops.length === 0) issues.push("No path hops are available for inspection.");
  if (path.hops.some((hop) => !hop.evidenceReference.trim())) {
    issues.push("One or more hops lack a source evidence reference.");
  }
  if (path.hops.some((hop) => hop.provenanceKind !== "ObservedFact")) {
    issues.push("At least one hop is inferred; confirm it before treating this path as observed access.");
  }
  if (rank != null && (rank.pathId !== path.pathId || rank.snapshotId !== path.snapshotId)) {
    issues.push("Rank and inspected path refer to different path or snapshot identities.");
  }
  if (path.relatedCutPoints.length === 0) {
    issues.push("No cut point is available; select a remediation action after reviewing the path.");
  }
  const affectedAssetIds = [...new Set(path.hops.map((hop) => hop.cloudResourceId).filter((id): id is string => !!id))];
  const verificationStatus = instance?.verificationSnapshotId
    ? `Verification snapshot recorded: ${instance.verificationSnapshotId}`
    : instance == null ? "No remediation instance linked; verification has not started."
      : `Remediation ${instance.status}; no verification snapshot recorded.`;
  return { status: issues.length ? "VERIFY_EVIDENCE" : "READY_FOR_REVIEW", issues,
    affectedAssetIds, verificationStatus };
}
