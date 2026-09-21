/** Operator header prefix for remediation pattern registry freshness. */
export const REMEDIATION_PATTERNS_LAST_REFRESHED_PREFIX = "Refreshed" as const;

export const REMEDIATION_PATTERNS_REFRESHING_LABEL = "Refreshing pattern registry…" as const;

const REMEDIATION_PATTERNS_STALE_AFTER_MS = 5 * 60 * 1000;

export function resolveRemediationPatternsLastRefreshedAt(input: {
  readonly listUpdatedAt: number;
  readonly detailUpdatedAt: number | null;
}): Date | null {
  const timestamps = [input.listUpdatedAt];

  if (input.detailUpdatedAt !== null) {
    timestamps.push(input.detailUpdatedAt);
  }

  const maxMs = Math.max(...timestamps.filter((value) => value > 0));

  if (!Number.isFinite(maxMs) || maxMs <= 0) {
    return null;
  }

  return new Date(maxMs);
}

export function remediationPatternsDataStaleCue(
  lastRefreshedAt: Date | null,
  nowMs: number,
): string | null {
  if (lastRefreshedAt === null) {
    return null;
  }

  const ageMs = nowMs - lastRefreshedAt.getTime();

  if (ageMs < REMEDIATION_PATTERNS_STALE_AFTER_MS) {
    return null;
  }

  return "Pattern registry may be stale — refresh to load the latest versions.";
}
