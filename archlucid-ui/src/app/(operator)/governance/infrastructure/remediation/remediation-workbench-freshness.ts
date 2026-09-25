import {
  operatorFreshnessMetadataWithClockLabel,
  operatorHomeDataCurrencyStaleCue,
} from "@/lib/operator/operator-last-refreshed-label";

export const REMEDIATION_WORKBENCH_LAST_REFRESHED_PREFIX = "Last refreshed" as const;
export const REMEDIATION_WORKBENCH_REFRESHING_LABEL = "Refreshing remediation instances…" as const;

export function remediationWorkbenchDataStaleCue(
  lastRefreshedAt: Date | null,
  nowMs: number,
): string | null {
  if (lastRefreshedAt === null) {
    return null;
  }

  return operatorHomeDataCurrencyStaleCue(lastRefreshedAt, nowMs);
}

export function remediationWorkbenchFreshnessLabel(input: {
  readonly lastRefreshedAt: Date | null;
  readonly refreshing: boolean;
}): string {
  if (input.refreshing) {
    if (input.lastRefreshedAt === null) {
      return REMEDIATION_WORKBENCH_REFRESHING_LABEL;
    }

    return `${operatorFreshnessMetadataWithClockLabel({
      prefix: REMEDIATION_WORKBENCH_LAST_REFRESHED_PREFIX,
      lastRefreshedAt: input.lastRefreshedAt,
      refreshingLabel: null,
    })} · ${REMEDIATION_WORKBENCH_REFRESHING_LABEL}`;
  }

  return operatorFreshnessMetadataWithClockLabel({
    prefix: REMEDIATION_WORKBENCH_LAST_REFRESHED_PREFIX,
    lastRefreshedAt: input.lastRefreshedAt,
    refreshingLabel: null,
  });
}
