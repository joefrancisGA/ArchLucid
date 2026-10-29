import { DEFAULT_IANA_TIME_ZONE_ID } from "@/lib/default-iana-time-zone";
import { formatInstantInPreferredTimeZone } from "@/lib/locale-datetime";
import type { InfraEvidenceDiffSummary, InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

export function formatInfraEvidenceSnapshotCapturedLabel(
  capturedUtc: string | null | undefined,
  ianaTimeZoneId: string = DEFAULT_IANA_TIME_ZONE_ID,
): string {
  if (capturedUtc == null || capturedUtc.trim().length === 0) {
    return "Captured time was not stored.";
  }

  const formatted = formatInstantInPreferredTimeZone(capturedUtc, ianaTimeZoneId);

  if (formatted === " — ") {
    return "Captured time was not stored.";
  }

  return formatted;
}

export function formatInfraEvidenceSnapshotResourceCountLabel(
  resourceCount: number | null | undefined,
): string {
  if (typeof resourceCount === "number" && Number.isFinite(resourceCount)) {
    return `${resourceCount} resources`;
  }

  return "Resource count was not stored.";
}

export function formatInfraEvidenceSnapshotFiniteCountCell(
  value: number | null | undefined,
  notStoredLabel: string,
): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return notStoredLabel;
}

export function formatInfraEvidenceSubscriptionLabel(
  subscriptionName: string | null | undefined,
  subscriptionId: string | null | undefined,
): string | null {
  const segments = formatInfraEvidenceSubscriptionLabelSegments(subscriptionName, subscriptionId);

  if (segments.length === 0) {
    return null;
  }

  return segments.join(" ");
}

/** Subscription line for snapshot freshness labels (never substitutes a GUID for the name). */
export function formatInfraEvidenceSubscriptionLabelSegments(
  subscriptionName: string | null | undefined,
  subscriptionId: string | null | undefined,
): readonly string[] {
  const name = subscriptionName?.trim() ?? "";
  const id = subscriptionId?.trim() ?? "";

  if (name.length > 0 && !isUuidLike(name)) {
    return [name];
  }

  if (id.length === 0 && name.length === 0) {
    return ["Subscription was not stored."];
  }

  const segments: string[] = ["Subscription name was not stored."];

  if (id.length > 0) {
    segments.push(`Subscription id ${id}.`);
  }

  return segments;
}

export function formatInfraEvidenceSnapshotLabel(snapshot: InfraEvidenceSnapshotSummary): string {
  const captured = formatInfraEvidenceSnapshotCapturedLabel(snapshot.capturedUtc);
  const parts: string[] = [
    ...formatInfraEvidenceSubscriptionLabelSegments(snapshot.subscriptionName, snapshot.subscriptionId),
    captured,
    formatInfraEvidenceSnapshotResourceCountLabel(snapshot.resourceCount),
  ];

  return parts.join(" · ");
}

export function formatInfraEvidenceSnapshotFreshness(snapshot: InfraEvidenceSnapshotSummary): string {
  const captured = formatInfraEvidenceSnapshotCapturedLabel(snapshot.capturedUtc);
  const parts: string[] = [
    ...formatInfraEvidenceSubscriptionLabelSegments(snapshot.subscriptionName, snapshot.subscriptionId),
    `captured ${captured}`,
    formatInfraEvidenceSnapshotResourceCountLabel(snapshot.resourceCount),
  ];

  return parts.join(" · ");
}

export function formatInfraEvidenceDiffTotalChangesPhrase(totalChanges: number | undefined): string {
  if (totalChanges === undefined || !Number.isFinite(totalChanges)) {
    return "Change count was not stored.";
  }

  return `${totalChanges} changes`;
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

  return `${formatInfraEvidenceDiffTotalChangesPhrase(diff.totalChanges)} vs ${otherCaptured}`;
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
    parts.push(formatInfraEvidenceDiffTotalChangesPhrase(input.selectedDiff.totalChanges));
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
}
