export function formatRunDetailCriticalFindingCountDisplay(
  hasFindingsSnapshot: boolean | undefined,
  count: number,
): string {
  if (hasFindingsSnapshot !== true) {
    return "Critical finding count was not stored.";
  }

  if (count === 0) {
    return "No critical findings were stored.";
  }

  return String(count);
}

export function formatRunDetailHighFindingCountDisplay(
  hasFindingsSnapshot: boolean | undefined,
  count: number,
): string {
  if (hasFindingsSnapshot !== true) {
    return "High finding count was not stored.";
  }

  if (count === 0) {
    return "No high findings were stored.";
  }

  return String(count);
}

export function formatRunDetailAwaitingActionCountDisplay(
  hasFindingsSnapshot: boolean | undefined,
  count: number,
): string {
  if (hasFindingsSnapshot !== true) {
    return "Findings requiring action were not stored.";
  }

  return String(count);
}
