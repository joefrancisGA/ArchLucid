import { planningPlanDetailPath } from "@/lib/planning-route";
import { signedRecordArtifactPath, signedRecordDetailPath } from "@/lib/signed-records-paths";

/** Canonical dev quick-jump paths for operator home entity chips (local dev only). */

export function devTestingPlanDetailPath(planId: string): string {
  return planningPlanDetailPath(planId);
}

export function devTestingRunDetailPath(runId: string): string {
  return `/architecture/reviews/${encodeURIComponent(runId.trim())}`;
}

export function devTestingApprovalLineagePath(approvalRequestId: string): string {
  return `/governance/approval-requests/${encodeURIComponent(approvalRequestId.trim())}/lineage`;
}

export function devTestingManifestDetailPath(manifestId: string): string {
  return signedRecordDetailPath(manifestId);
}

export function devTestingManifestArtifactPath(manifestId: string, artifactId: string): string {
  return signedRecordArtifactPath(manifestId, artifactId);
}
