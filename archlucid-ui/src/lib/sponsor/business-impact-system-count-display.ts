export function presentBusinessImpactSystemCountLabel(
  systemCount: number | null | undefined,
): string | null {
  if (typeof systemCount !== "number" || !Number.isFinite(systemCount)) {
    return "System count not returned";
  }

  return null;
}

export function businessImpactHasCommittedRuns(systemCount: number | null | undefined): boolean {
  if (typeof systemCount !== "number" || !Number.isFinite(systemCount)) {
    return false;
  }

  return systemCount > 0;
}
