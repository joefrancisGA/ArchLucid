/** Normalizes project identifiers for cross-scope ownership checks (TB-077). */
export function normalizeProjectId(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Returns true when the run's project matches the effective operator scope project header. */
export function runProjectMatchesEffectiveScope(
  runProjectId: string | null | undefined,
  effectiveScopeProjectId: string | null | undefined,
): boolean {
  const runProject = normalizeProjectId(runProjectId);
  const scopeProject = normalizeProjectId(effectiveScopeProjectId);

  if (runProject.length === 0 || scopeProject.length === 0) {
    return true;
  }

  return runProject === scopeProject;
}

/** Resolves project id from scope header map (`x-project-id`). */
export function projectIdFromScopeHeaders(headers: Record<string, string>): string | undefined {
  const raw = headers["x-project-id"]?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}
