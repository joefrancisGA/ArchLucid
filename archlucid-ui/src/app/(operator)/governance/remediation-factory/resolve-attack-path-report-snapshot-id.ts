import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";

export const ATTACK_PATH_REPORT_RANKED_SNAPSHOT_HINT =
  "This report uses the snapshot of the first ranked path." as const;

export const ATTACK_PATH_REPORT_NO_SNAPSHOT =
  "No ranked paths are available yet, so the attack path report needs an inventory snapshot." as const;

export function resolveAttackPathReportSnapshotId(
  toSnapshotId: string | null,
  fromSnapshotId: string | null,
  rankedPaths: ReadonlyArray<SecurityEvidencePathRankSummary>,
  rankedPathsLoading: boolean,
): string | null {
  const fromPair = toSnapshotId ?? fromSnapshotId;

  if (fromPair !== null && fromPair.trim().length > 0) {
    return fromPair.trim();
  }

  if (rankedPathsLoading) {
    return null;
  }

  if (rankedPaths.length === 0) {
    return null;
  }

  const firstByRank = [...rankedPaths].sort(
    (left, right) => (left.rankOrder ?? Number.MAX_SAFE_INTEGER) - (right.rankOrder ?? Number.MAX_SAFE_INTEGER),
  )[0];

  const snapshotId = firstByRank.snapshotId.trim();

  return snapshotId.length > 0 ? snapshotId : null;
}

export function shouldShowAttackPathReportRankedSnapshotHint(
  toSnapshotId: string | null,
  fromSnapshotId: string | null,
  rankedPaths: ReadonlyArray<SecurityEvidencePathRankSummary>,
): boolean {
  if (toSnapshotId !== null || fromSnapshotId !== null) {
    return false;
  }

  const snapshotIds = new Set(
    rankedPaths.map((row) => row.snapshotId.trim()).filter((id) => id.length > 0),
  );

  return snapshotIds.size > 1;
}
