import { isArchitectureInventorySnapshotStale } from "@/lib/architecture/architecture-inventory-snapshot-freshness";
import { formatInfraEvidenceSnapshotCapturedLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { formatRelativeTime } from "@/lib/relative-time";

export type DiagramReconcileSnapshotSelectionSummary = {
  readonly ageLabel: string;
  readonly selectionMarker: "Latest" | "Auto-selected" | null;
  readonly stale: boolean;
  readonly capturedLabel: string;
};

export function resolveDiagramReconcileSnapshotSelectionSummary(input: {
  readonly snapshots: readonly InfraEvidenceSnapshotSummary[];
  readonly selectedSnapshotId: string;
  readonly urlSnapshotId: string;
  readonly nowMs?: number;
}): DiagramReconcileSnapshotSelectionSummary | null {
  const selected = input.snapshots.find((snapshot) => snapshot.snapshotId === input.selectedSnapshotId);

  if (selected == null) {
    return null;
  }

  const nowMs = input.nowMs ?? Date.now();
  const capturedUtc = selected.capturedUtc ?? "";
  const hasCaptureTime = capturedUtc.trim().length > 0;
  const ageLabel = hasCaptureTime ? formatRelativeTime(capturedUtc, nowMs) : "Captured time was not stored";
  const latestSnapshotId = input.snapshots[0]?.snapshotId ?? "";
  const selectionMarker = !hasCaptureTime
    ? null
    :
    input.urlSnapshotId.trim().length === 0 && selected.snapshotId === latestSnapshotId
      ? "Auto-selected"
      : selected.snapshotId === latestSnapshotId
        ? "Latest"
        : null;

  return {
    ageLabel,
    selectionMarker,
    stale: isArchitectureInventorySnapshotStale(capturedUtc, new Date(nowMs)),
    capturedLabel: formatInfraEvidenceSnapshotCapturedLabel(capturedUtc),
  };
}
