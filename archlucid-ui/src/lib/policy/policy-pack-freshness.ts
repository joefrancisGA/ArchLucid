/** Operator header prefix for policy packs hub freshness. */
export const POLICY_PACKS_DATA_STALE_CUE =
  "Pack inventory may be stale — refresh to reload registered packs and merged effective policy." as const;

const POLICY_PACKS_STALE_AFTER_MS = 5 * 60 * 1000;

export function policyPacksDataStaleCue(lastRefreshedAt: Date | null, nowMs: number): string | null {
  if (lastRefreshedAt === null) {
    return null;
  }

  const ageMs = nowMs - lastRefreshedAt.getTime();

  if (ageMs < POLICY_PACKS_STALE_AFTER_MS) {
    return null;
  }

  return POLICY_PACKS_DATA_STALE_CUE;
}
