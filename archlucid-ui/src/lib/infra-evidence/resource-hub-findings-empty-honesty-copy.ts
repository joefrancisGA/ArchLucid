export function formatResourceHubFindingsStoredEmptyLine(snapshotId: string): string {
  const id = snapshotId.trim();

  if (id.length === 0) {
    return "No findings linked to this resource were stored for the selected snapshot scope.";
  }

  return `No findings linked to this resource were stored in snapshot ${id.slice(0, 8)}… — this is not a load failure.`;
}