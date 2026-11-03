export const WORKSPACE_PRIMARY_CONCERN_SEVERITY_FIRST_SUFFIX =
  " (first unresolved finding by severity — not a stored primary-concern field)" as const;

export function formatWorkspacePrimaryConcernDisplay(
  primaryConcern: string | null | undefined,
  hasFindingsSnapshot: boolean,
): string {
  const trimmed = primaryConcern?.trim() ?? "";

  if (trimmed.length > 0) {
    return `${trimmed}${WORKSPACE_PRIMARY_CONCERN_SEVERITY_FIRST_SUFFIX}`;
  }

  if (hasFindingsSnapshot) {
    return "No unresolved findings";
  }

  return "Primary concern was not stored.";
}
