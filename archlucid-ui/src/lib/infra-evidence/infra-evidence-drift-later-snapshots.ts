import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { infraEvidenceSnapshotsShareSubscription } from "@/lib/infra-evidence/infra-evidence-drift-subscription-scope";

function parseInfraEvidenceInstantMs(instantUtc: string | null | undefined): number | null {
  if (instantUtc == null || instantUtc.trim().length === 0) {
    return null;
  }

  const parsedMs = Date.parse(instantUtc);

  if (Number.isNaN(parsedMs)) {
    return null;
  }

  return parsedMs;
}

export type InfraEvidenceLaterSnapshotsPartition = {
  readonly sameSubscription: readonly InfraEvidenceSnapshotSummary[];
  readonly crossSubscription: readonly InfraEvidenceSnapshotSummary[];
};

/** Later inventory captures relative to an anchor snapshot, split by subscription scope. */
export function partitionInfraEvidenceLaterSnapshotsForAnchor(
  anchorSnapshot: InfraEvidenceSnapshotSummary,
  snapshots: readonly InfraEvidenceSnapshotSummary[],
): InfraEvidenceLaterSnapshotsPartition {
  const anchorCapturedMs = parseInfraEvidenceInstantMs(anchorSnapshot.capturedUtc);

  if (anchorCapturedMs == null) {
    return { sameSubscription: [], crossSubscription: [] };
  }

  const laterSnapshots = snapshots.filter((snapshot) => {
    if (snapshot.snapshotId === anchorSnapshot.snapshotId) {
      return false;
    }

    const capturedMs = parseInfraEvidenceInstantMs(snapshot.capturedUtc);

    return capturedMs != null && capturedMs > anchorCapturedMs;
  });

  const sameSubscription: InfraEvidenceSnapshotSummary[] = [];
  const crossSubscription: InfraEvidenceSnapshotSummary[] = [];

  for (const snapshot of laterSnapshots) {
    if (infraEvidenceSnapshotsShareSubscription(anchorSnapshot, snapshot)) {
      sameSubscription.push(snapshot);
      continue;
    }

    crossSubscription.push(snapshot);
  }

  return { sameSubscription, crossSubscription };
}
