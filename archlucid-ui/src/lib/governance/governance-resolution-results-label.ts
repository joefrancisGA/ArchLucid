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

  const decisionsLabel = Array.isArray(data.decisions) ? `${data.decisions.length} decisions` : "Decisions not returned";
  const conflictsLabel = Array.isArray(data.conflicts) ? `${data.conflicts.length} conflicts` : "Conflicts not returned";

  return `${decisionsLabel} · ${conflictsLabel}`;
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
