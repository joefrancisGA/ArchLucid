/** Empty copy assumes the snapshot list loaded. A failed fetch must not also say there are no snapshots. */
export function shouldShowInfraDriftSnapshotsEmptyState(input: {
  readonly loadingSnapshots: boolean;
  readonly snapshotCount: number;
  readonly loadError: string | null;
}): boolean {
  if (input.loadingSnapshots) {
    return false;
  }

  if (input.snapshotCount > 0) {
    return false;
  }

  const loadError = input.loadError?.trim() ?? "";

  return loadError.length === 0;
}
