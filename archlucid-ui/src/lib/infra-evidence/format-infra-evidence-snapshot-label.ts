import type { InfraEvidenceDiffSummary, InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

export function formatInfraEvidenceSnapshotCapturedLabel(capturedUtc: string | null | undefined): string {
  if (capturedUtc == null || capturedUtc.trim().length === 0) {
    return "unknown time";
  }

  return new Date(capturedUtc).toLocaleString();
}

export function formatInfraEvidenceSubscriptionLabel(
  subscriptionName: string | null | undefined,
  subscriptionId: string | null | undefined,
): string | null {
  const name = subscriptionName?.trim() ?? "";

  if (name.length > 0 && !isUuidLike(name)) {
    return name;
  }

  const id = subscriptionId?.trim() ?? "";

  if (id.length > 0 && !isUuidLike(id)) {
    return id;
  }

  return null;
}

export function formatInfraEvidenceSnapshotLabel(snapshot: InfraEvidenceSnapshotSummary): string {
  const captured = formatInfraEvidenceSnapshotCapturedLabel(snapshot.capturedUtc);
  const subscription = formatInfraEvidenceSubscriptionLabel(snapshot.subscriptionName, snapshot.subscriptionId);
  const parts: string[] = [];

  if (subscription != null) {
    parts.push(subscription);
  }

  parts.push(captured);
  parts.push(`${snapshot.resourceCount} resources`);

  return parts.join(" · ");
}

export function formatInfraEvidenceSnapshotFreshness(snapshot: InfraEvidenceSnapshotSummary): string {
  const captured = formatInfraEvidenceSnapshotCapturedLabel(snapshot.capturedUtc);
  const subscription = formatInfraEvidenceSubscriptionLabel(snapshot.subscriptionName, snapshot.subscriptionId);
  const parts: string[] = [];

  if (subscription != null) {
    parts.push(subscription);
  }

  parts.push(`captured ${captured}`);
  parts.push(`${snapshot.resourceCount} resources`);

  return parts.join(" · ");
}

export function formatInfraEvidenceDiffLabel(
  diff: InfraEvidenceDiffSummary,
  selectedSnapshotId: string,
  snapshots: readonly InfraEvidenceSnapshotSummary[],
): string {
  const otherId = diff.snapshotAId === selectedSnapshotId ? diff.snapshotBId : diff.snapshotAId;
  const otherSnapshot = snapshots.find((snapshot) => snapshot.snapshotId === otherId);
  const otherCaptured =
    otherSnapshot != null
      ? formatInfraEvidenceSnapshotCapturedLabel(otherSnapshot.capturedUtc)
      : formatInfraEvidenceSnapshotCapturedLabel(diff.createdUtc);

  return `${diff.totalChanges} changes vs ${otherCaptured}`;
}

export function formatInfraEvidenceScopeFreshnessLine(input: {
  readonly snapshot: InfraEvidenceSnapshotSummary | null;
  readonly selectedDiff: InfraEvidenceDiffSummary | null;
}): string | null {
  const parts: string[] = [];

  if (input.snapshot != null) {
    parts.push(formatInfraEvidenceSnapshotFreshness(input.snapshot));
  }

  if (input.selectedDiff != null) {
    parts.push(`${input.selectedDiff.totalChanges} changes`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
}
