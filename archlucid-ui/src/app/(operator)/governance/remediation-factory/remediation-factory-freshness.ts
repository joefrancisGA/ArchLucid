import {
  operatorHomeDataCurrencyStaleCue,
  operatorLastRefreshedLabel,
} from "@/lib/operator/operator-last-refreshed-label";

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

export function remediationFactoryPerSourceAgeLines(input: {
  readonly metricsUpdatedAt: number | undefined;
  readonly rankedUpdatedAt: number | undefined;
  readonly rankedPathsUpdatedAt: number | undefined;
}): string {
  const format = (label: string, updatedAt: number | undefined): string => {
    if (updatedAt === undefined) {
      return `${label}: not loaded`;
    }

    return `${label}: ${operatorLastRefreshedLabel(new Date(updatedAt))}`;
  };

  return [
    format("Executive metrics", input.metricsUpdatedAt),
    format("Priority queue", input.rankedUpdatedAt),
    format("Ranked paths", input.rankedPathsUpdatedAt),
  ].join(" · ");
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
