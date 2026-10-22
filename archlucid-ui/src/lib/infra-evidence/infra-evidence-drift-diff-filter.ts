import type { InfraEvidenceDiffSummary, InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { resolveInfraEvidenceDiffOtherSnapshot } from "@/lib/infra-evidence/infra-evidence-drift-subscription-scope";

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

function resolveInfraEvidenceDiffComparisonCapturedUtc(
  diff: InfraEvidenceDiffSummary,
  anchorSnapshotId: string,
  snapshots: readonly InfraEvidenceSnapshotSummary[],
): string | null {
  const otherSnapshot = resolveInfraEvidenceDiffOtherSnapshot(diff, anchorSnapshotId, snapshots);

  if (otherSnapshot?.capturedUtc != null && otherSnapshot.capturedUtc.trim().length > 0) {
    return otherSnapshot.capturedUtc;
  }

  return diff.createdUtc;
}

export function isInfraEvidenceDiffCapturedAfterAnchorSnapshot(
  diff: InfraEvidenceDiffSummary,
  anchorSnapshot: InfraEvidenceSnapshotSummary,
  snapshots: readonly InfraEvidenceSnapshotSummary[],
): boolean {
  const anchorCapturedMs = parseInfraEvidenceInstantMs(anchorSnapshot.capturedUtc);

  if (anchorCapturedMs == null) {
    return false;
  }

  const comparisonCapturedUtc = resolveInfraEvidenceDiffComparisonCapturedUtc(
    diff,
    anchorSnapshot.snapshotId,
    snapshots,
  );
  const comparisonCapturedMs = parseInfraEvidenceInstantMs(comparisonCapturedUtc);

  if (comparisonCapturedMs == null) {
    return false;
  }

  return comparisonCapturedMs > anchorCapturedMs;
}

export function filterInfraEvidenceDiffsAfterAnchorSnapshot(
  diffs: readonly InfraEvidenceDiffSummary[],
  anchorSnapshot: InfraEvidenceSnapshotSummary,
  snapshots: readonly InfraEvidenceSnapshotSummary[],
): InfraEvidenceDiffSummary[] {
  return diffs.filter((diff) =>
    isInfraEvidenceDiffCapturedAfterAnchorSnapshot(diff, anchorSnapshot, snapshots),
  );
}
