import { operatorHomeDataCurrencyStaleCue } from "@/lib/operator/operator-last-refreshed-label";
import {
  operatorFreshnessMetadataWithClockLabel,
} from "@/lib/operator/operator-last-refreshed-label";

export const REMEDIATION_FACTORY_LAST_REFRESHED_PREFIX = "Last refreshed" as const;
export const REMEDIATION_FACTORY_REFRESHING_LABEL = "Refreshing remediation factory data…" as const;

export function resolveRemediationFactoryLastRefreshedAt(input: {
  readonly metricsUpdatedAt: number | undefined;
  readonly rankedUpdatedAt: number | undefined;
  readonly rankedPathsUpdatedAt: number | undefined;
  readonly outcomeUpdatedAt: number | undefined;
  readonly snapshotsUpdatedAt: number | undefined;
}): Date | null {
  const candidates = [
    input.metricsUpdatedAt,
    input.rankedUpdatedAt,
    input.rankedPathsUpdatedAt,
    input.outcomeUpdatedAt,
    input.snapshotsUpdatedAt,
  ].filter((value): value is number => value !== undefined && value > 0);

  if (candidates.length === 0) {
    return null;
  }

  return new Date(Math.min(...candidates));
}

export function remediationFactoryDataStaleCue(
  lastRefreshedAt: Date | null,
  nowMs: number,
): string | null {
  if (lastRefreshedAt === null) {
    return null;
  }

  return operatorHomeDataCurrencyStaleCue(lastRefreshedAt, nowMs);
}

/** Preserve the prior timestamp while a refresh is in flight. */
export function remediationFactoryFreshnessLabel(input: {
  readonly lastRefreshedAt: Date | null;
  readonly refreshing: boolean;
}): string {
  if (input.refreshing) {
    if (input.lastRefreshedAt === null) {
      return REMEDIATION_FACTORY_REFRESHING_LABEL;
    }

    return `${operatorFreshnessMetadataWithClockLabel({
      prefix: REMEDIATION_FACTORY_LAST_REFRESHED_PREFIX,
      lastRefreshedAt: input.lastRefreshedAt,
      refreshingLabel: null,
    })} · ${REMEDIATION_FACTORY_REFRESHING_LABEL}`;
  }

  if (input.lastRefreshedAt === null) {
    return operatorFreshnessMetadataWithClockLabel({
      prefix: REMEDIATION_FACTORY_LAST_REFRESHED_PREFIX,
      lastRefreshedAt: null,
      refreshingLabel: null,
    });
  }

  return operatorFreshnessMetadataWithClockLabel({
    prefix: REMEDIATION_FACTORY_LAST_REFRESHED_PREFIX,
    lastRefreshedAt: input.lastRefreshedAt,
    refreshingLabel: null,
  });
}
