export function formatInfrastructureAskInsufficientEvidenceSnapshotLine(snapshotId: string | null): string {
  const id = snapshotId?.trim() ?? "";

  if (id.length === 0) {
    return "Insufficient evidence answers reference the pinned inventory snapshot when one is selected — without a snapshot, hop-level citations may be missing.";
  }

  return `Insufficient evidence answers reference stored rows in snapshot ${id} — they are not live Azure verification.`;
}