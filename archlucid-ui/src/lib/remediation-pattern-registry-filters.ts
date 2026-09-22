import type { RemediationPatternRecord } from "@/lib/remediation-pattern-types";
import { remediationPatternRegistryNeedsAttention } from "@/lib/remediation-pattern-content";

export const REMEDIATION_PATTERN_REGISTRY_FILTER_PARAM = "registryFilter" as const;

export const REMEDIATION_PATTERN_REGISTRY_FILTERS = {
  all: "all",
  needsAttention: "needs-attention",
  hasApproved: "has-approved",
} as const;

export type RemediationPatternRegistryFilter =
  (typeof REMEDIATION_PATTERN_REGISTRY_FILTERS)[keyof typeof REMEDIATION_PATTERN_REGISTRY_FILTERS];

export function parseRemediationPatternRegistryFilterFromSearch(
  raw: string | null | undefined,
): RemediationPatternRegistryFilter {
  const trimmed = raw?.trim() ?? "";

  switch (trimmed) {
    case REMEDIATION_PATTERN_REGISTRY_FILTERS.needsAttention:
      return REMEDIATION_PATTERN_REGISTRY_FILTERS.needsAttention;
    case REMEDIATION_PATTERN_REGISTRY_FILTERS.hasApproved:
      return REMEDIATION_PATTERN_REGISTRY_FILTERS.hasApproved;
    default:
      return REMEDIATION_PATTERN_REGISTRY_FILTERS.all;
  }
}

export function filterRemediationPatternRegistry(
  patterns: ReadonlyArray<RemediationPatternRecord>,
  filter: RemediationPatternRegistryFilter,
): RemediationPatternRecord[] {
  switch (filter) {
    case REMEDIATION_PATTERN_REGISTRY_FILTERS.needsAttention:
      return patterns.filter(remediationPatternRegistryNeedsAttention);
    case REMEDIATION_PATTERN_REGISTRY_FILTERS.hasApproved:
      return patterns.filter((pattern) => !remediationPatternRegistryNeedsAttention(pattern));
    default:
      return [...patterns];
  }
}

export function countRemediationPatternRegistryByFilter(
  patterns: ReadonlyArray<RemediationPatternRecord>,
): Record<RemediationPatternRegistryFilter, number> {
  const needsAttention = patterns.filter(remediationPatternRegistryNeedsAttention).length;

  return {
    [REMEDIATION_PATTERN_REGISTRY_FILTERS.all]: patterns.length,
    [REMEDIATION_PATTERN_REGISTRY_FILTERS.needsAttention]: needsAttention,
    [REMEDIATION_PATTERN_REGISTRY_FILTERS.hasApproved]: patterns.length - needsAttention,
  };
}

export function remediationPatternRegistryFilterHrefFromSearch(
  currentSearch: string,
  filter: RemediationPatternRegistryFilter,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (filter === REMEDIATION_PATTERN_REGISTRY_FILTERS.all) {
    params.delete(REMEDIATION_PATTERN_REGISTRY_FILTER_PARAM);
  } else {
    params.set(REMEDIATION_PATTERN_REGISTRY_FILTER_PARAM, filter);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
