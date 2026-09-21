import type { InfraEvidenceDiffSummary, InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { formatInfraEvidenceSubscriptionLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";

export function normalizeInfraEvidenceSubscriptionId(
  subscriptionId: string | null | undefined,
): string | null {
  const normalized = subscriptionId?.trim() ?? "";

  if (normalized.length === 0) {
    return null;
  }

  return normalized.toLowerCase();
}

export function resolveInfraEvidenceSnapshotSubscriptionLabel(
  snapshot: InfraEvidenceSnapshotSummary,
): string {
  const label = formatInfraEvidenceSubscriptionLabel(snapshot.subscriptionName, snapshot.subscriptionId);

  return label ?? "Unknown subscription";
}

export function infraEvidenceSnapshotsShareSubscription(
  left: InfraEvidenceSnapshotSummary,
  right: InfraEvidenceSnapshotSummary,
): boolean {
  const leftSubscriptionId = normalizeInfraEvidenceSubscriptionId(left.subscriptionId);
  const rightSubscriptionId = normalizeInfraEvidenceSubscriptionId(right.subscriptionId);

  if (leftSubscriptionId == null || rightSubscriptionId == null) {
    return true;
  }

  return leftSubscriptionId === rightSubscriptionId;
}

export function resolveInfraEvidenceDiffOtherSnapshotId(
  diff: InfraEvidenceDiffSummary,
  selectedSnapshotId: string,
): string {
  if (diff.snapshotAId === selectedSnapshotId) {
    return diff.snapshotBId;
  }

  return diff.snapshotAId;
}

export function resolveInfraEvidenceDiffOtherSnapshot(
  diff: InfraEvidenceDiffSummary,
  selectedSnapshotId: string,
  snapshots: readonly InfraEvidenceSnapshotSummary[],
): InfraEvidenceSnapshotSummary | null {
  const otherSnapshotId = resolveInfraEvidenceDiffOtherSnapshotId(diff, selectedSnapshotId).trim();

  if (otherSnapshotId.length === 0) {
    return null;
  }

  return snapshots.find((snapshot) => snapshot.snapshotId === otherSnapshotId) ?? null;
}
