export function reviewsHubFindingsCountDisplay(count: number | null | undefined): string {
  if (count === null || count === undefined || !Number.isFinite(count)) {
    return "Finding count was not stored.";
  }

  return String(Math.trunc(count));
}

export function reviewsHubRiskCountDisplay(count: number | null | undefined): string {
  if (count === null || count === undefined || !Number.isFinite(count)) {
    return "Risk count was not stored.";
  }

  return String(Math.trunc(count));
}
