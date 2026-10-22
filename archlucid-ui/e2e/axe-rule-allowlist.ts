/**
 * Temporary axe rule suppressions for live E2E scans (`live-api-accessibility*.spec.ts`).
 * Prefer fixing the UI; use only for documented false positives or upstream limitations.
 * Each entry MUST include {@link AxeRuleAllowlistEntry.expiresOn} (UTC calendar date) and a short reason.
 */
export interface AxeRuleAllowlistEntry {
  ruleId: string;
  reason: string;
  /** ISO calendar date YYYY-MM-DD — entries after this day (UTC end-of-day) are ignored. */
  expiresOn: string;
}

export const axeLiveE2eRuleAllowlist: AxeRuleAllowlistEntry[] = [];

/**
 * Rule IDs to pass to `runAxe` from `./helpers/axe-helper.ts` as `disableRules` for live CI scans.
 * Expired allowlist rows are dropped so CI cannot silently ignore rules forever.
 */
export function axeLiveE2eDisableRuleIdsNow(): string[] {
  const now = Date.now();

  return axeLiveE2eRuleAllowlist
    .filter((entry) => {
      const expiryEndUtc = Date.parse(`${entry.expiresOn}T23:59:59.999Z`);

      return Number.isFinite(expiryEndUtc) && expiryEndUtc >= now;
    })
    .map((entry) => entry.ruleId);
}
