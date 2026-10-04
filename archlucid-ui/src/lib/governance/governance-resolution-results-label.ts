type GovernanceResolutionCountsSource = {
  readonly decisions: readonly unknown[];
  readonly conflicts: readonly unknown[];
};

export function formatGovernanceResolutionResultsSummaryLabel(
  loading: boolean,
  data: GovernanceResolutionCountsSource | null | undefined,
): string {
  if (loading) {
    return "Loading resolution…";
  }

  if (data === null || data === undefined) {
    return "Not loaded";
  }

  return `${data.decisions.length} decisions · ${data.conflicts.length} conflicts`;
}

export function formatGovernanceResolutionSectionCountLabel(
  loading: boolean,
  data: GovernanceResolutionCountsSource | null | undefined,
  kind: "decisions" | "conflicts",
): string {
  if (loading) {
    return "Loading…";
  }

  if (data === null || data === undefined) {
    return "Not loaded";
  }

  const count = kind === "decisions" ? data.decisions.length : data.conflicts.length;

  return String(count);
}
