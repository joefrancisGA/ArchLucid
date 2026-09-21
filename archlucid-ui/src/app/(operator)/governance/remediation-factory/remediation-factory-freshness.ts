import { operatorHomeDataCurrencyStaleCue } from "@/lib/operator/operator-last-refreshed-label";

export const REMEDIATION_FACTORY_LAST_REFRESHED_PREFIX = "Last refreshed" as const;
export const REMEDIATION_FACTORY_REFRESHING_LABEL = "Refreshing remediation factory data…" as const;

export function resolveRemediationFactoryLastRefreshedAt(input: {
  readonly metricsUpdatedAt: number | undefined;
  readonly rankedUpdatedAt: number | undefined;
  readonly rankedPathsUpdatedAt: number | undefined;
}): Date | null {
  const candidates = [
    input.metricsUpdatedAt,
    input.rankedUpdatedAt,
    input.rankedPathsUpdatedAt,
  ].filter((value): value is number => value !== undefined);

  if (candidates.length === 0) {
    return null;
  }

  return new Date(Math.max(...candidates));
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
