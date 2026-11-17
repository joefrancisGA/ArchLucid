import { isInfraEvidenceSnapshotCaptureSucceeded } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";

/**
 * A succeeded inventory snapshot counts as capture, including a manual ZIP.
 * A failed snapshot list leaves the caller value so a connector pull is not cleared.
 */
export function resolveCollectionSnapshotCaptureSucceeded(input: {
  readonly callerSnapshotCaptureSucceeded: boolean | null;
  readonly snapshotCaptureStatuses: readonly (number | string | null | undefined)[] | null;
}): boolean | null {
  const statuses = input.snapshotCaptureStatuses;

  if (statuses === null) {
    return input.callerSnapshotCaptureSucceeded;
  }

  const anySucceeded = statuses.some((status) => isInfraEvidenceSnapshotCaptureSucceeded(status));

  if (anySucceeded) {
    return true;
  }

  return input.callerSnapshotCaptureSucceeded;
}
