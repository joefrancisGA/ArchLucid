import {
  ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_MS,
} from "@/lib/architecture/architecture-inventory-snapshot-freshness";
import { formatCloudResourceExplorerWorkQueueLabel } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import type { CloudResourceExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { formatInfraEvidenceSnapshotCapturedLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import { formatRelativeTime } from "@/lib/relative-time";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type InfraEvidenceAskScopeSummaryInput = {
  readonly cloudResourceId?: string;
  readonly snapshotId?: string;
  readonly snapshotCapturedUtc?: string | null;
  readonly diffId?: string;
  readonly findingId?: string;
  readonly instanceId?: string;
  readonly correspondenceId?: string;
  readonly assessmentId?: string;
  readonly auditEvidenceSnapshotId?: string;
  readonly controlId?: string;
  readonly workQueue?: CloudResourceExplorerWorkQueue;
};

export type InfraEvidenceAskSnapshotFreshness = {
  readonly snapshotId: string;
  readonly capturedLabel: string;
  readonly ageLabel: string;
  readonly statusKind: EnterpriseStatusKind;
  readonly statusLabel: string;
};

function isInfraEvidenceSnapshotStale(
  capturedUtc: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (capturedUtc == null || capturedUtc.trim().length === 0) {
    return false;
  }

  const capturedMs = Date.parse(capturedUtc);

  if (Number.isNaN(capturedMs)) {
    return false;
  }

  return nowMs - capturedMs >= ARCHITECTURE_INVENTORY_SNAPSHOT_STALE_AFTER_MS;
}

export function resolveInfraEvidenceAskSnapshotFreshness(
  snapshotId: string,
  snapshotCapturedUtc: string | null | undefined,
  nowMs: number = Date.now(),
): InfraEvidenceAskSnapshotFreshness | null {
  const trimmedSnapshotId = snapshotId.trim();

  if (trimmedSnapshotId.length === 0) {
    return null;
  }

  const capturedLabel = formatInfraEvidenceSnapshotCapturedLabel(snapshotCapturedUtc);
  const hasCaptureTime = snapshotCapturedUtc != null && snapshotCapturedUtc.trim().length > 0;
  const ageLabel = hasCaptureTime ? formatRelativeTime(snapshotCapturedUtc ?? "", nowMs) : "capture time unknown";
  const stale = hasCaptureTime && isInfraEvidenceSnapshotStale(snapshotCapturedUtc, nowMs);

  return {
    snapshotId: trimmedSnapshotId,
    capturedLabel,
    ageLabel,
    statusKind: stale ? "needs-attention" : "ready",
    statusLabel: stale ? "Stale snapshot" : "Current snapshot",
  };
}

function formatSnapshotScopeSegment(
  snapshotId: string,
  snapshotCapturedUtc: string | null | undefined,
): string {
  const trimmedSnapshotId = snapshotId.trim();

  if (trimmedSnapshotId.length === 0) {
    return "";
  }

  const freshness = resolveInfraEvidenceAskSnapshotFreshness(trimmedSnapshotId, snapshotCapturedUtc);

  if (freshness == null) {
    return `snapshot ${trimmedSnapshotId}`;
  }

  const capturedSuffix =
    snapshotCapturedUtc != null && snapshotCapturedUtc.trim().length > 0
      ? ` (captured ${freshness.capturedLabel})`
      : "";

  return `snapshot ${trimmedSnapshotId}${capturedSuffix}`;
}

export function formatInfraEvidenceAskScopeStack(input: InfraEvidenceAskScopeSummaryInput): string | null {
  const segments: string[] = [];

  if (input.cloudResourceId != null && input.cloudResourceId.trim().length > 0) {
    segments.push(`resource ${input.cloudResourceId.trim()}`);
  }

  if (input.snapshotId != null && input.snapshotId.trim().length > 0) {
    segments.push(formatSnapshotScopeSegment(input.snapshotId, input.snapshotCapturedUtc));
  }

  if (input.diffId != null && input.diffId.trim().length > 0) {
    segments.push(`drift diff ${input.diffId.trim()}`);
  }

  if (input.findingId != null && input.findingId.trim().length > 0) {
    segments.push(`finding ${input.findingId.trim()}`);
  }

  if (input.instanceId != null && input.instanceId.trim().length > 0) {
    segments.push(`remediation instance ${input.instanceId.trim()}`);
  }

  if (input.correspondenceId != null && input.correspondenceId.trim().length > 0) {
    segments.push(`diagram correspondence ${input.correspondenceId.trim()}`);
  }

  if (
    input.assessmentId != null
    && input.assessmentId.trim().length > 0
    && input.auditEvidenceSnapshotId != null
    && input.auditEvidenceSnapshotId.trim().length > 0
    && input.controlId != null
    && input.controlId.trim().length > 0
  ) {
    segments.push(`audit control ${input.controlId.trim()}`);
  }

  if (input.workQueue != null && input.workQueue !== "all") {
    segments.push(`explorer ${formatCloudResourceExplorerWorkQueueLabel(input.workQueue)}`);
  }

  if (segments.length === 0) {
    return null;
  }

  return segments.join(" → ");
}
