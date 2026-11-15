export function shouldShowInfraEvidenceAskStaleSnapshotCitation(
  askedSnapshotId: string | null | undefined,
  currentSnapshotId: string,
): boolean {
  const asked = askedSnapshotId?.trim() ?? "";
  const current = currentSnapshotId.trim();

  if (asked.length === 0) {
    return false;
  }

  if (current.length === 0) {
    return true;
  }

  return asked !== current;
}

export function formatInfraEvidenceAskStaleSnapshotCitationLine(askedSnapshotId: string): string {
  const id = askedSnapshotId.trim();

  return `This answer cites snapshot ${id} from when you asked — your snapshot pin is different now.`;
}