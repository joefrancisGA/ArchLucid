import type {
  PatternLibraryFiltersState,
  PatternLibraryRecord,
  PatternLibrarySummary,
} from "@/lib/pattern-library-types";
import {
  PATTERN_LIBRARY_LAST_UPDATED_UTC,
  PATTERN_LIBRARY_SAMPLE_CATALOG,
} from "@/lib/pattern-library-catalog";
import { PATTERN_LIBRARY_MINIMUM_TENANT_THRESHOLD } from "@/lib/pattern-library-provenance";

export const DEFAULT_PATTERN_LIBRARY_FILTERS: PatternLibraryFiltersState = {
  query: "",
  domain: "All domains",
  platform: "All platforms",
  patternType: "All types",
  risk: "All risks",
  adoption: "All adoption",
  governance: "All policy areas",
  dataSource: "All sources",
  timeRange: "All time",
};

function matchesQuery(record: PatternLibraryRecord, query: string): boolean {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  const haystack = [
    record.name,
    record.description,
    record.patternType,
    ...record.domains,
    ...record.platforms,
    ...record.relatedControls,
    ...record.relatedPolicyPacks,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export function filterPatternLibraryRecords(
  records: readonly PatternLibraryRecord[],
  filters: PatternLibraryFiltersState,
): PatternLibraryRecord[] {
  return records.filter((record) => {
    if (!matchesQuery(record, filters.query)) {
      return false;
    }

    if (filters.domain !== "All domains" && !record.domains.includes(filters.domain)) {
      return false;
    }

    if (filters.platform !== "All platforms" && !record.platforms.includes(filters.platform)) {
      return false;
    }

    if (filters.patternType !== "All types" && record.patternType !== filters.patternType) {
      return false;
    }

    if (filters.risk !== "All risks" && record.risk !== filters.risk) {
      return false;
    }

    if (filters.adoption !== "All adoption" && record.adoption !== filters.adoption) {
      return false;
    }

    if (filters.governance !== "All policy areas" && record.governance !== filters.governance) {
      return false;
    }

    return true;
  });
}

export function derivePatternLibrarySummary(records: readonly PatternLibraryRecord[]): PatternLibrarySummary {
  const domains = new Set<string>();
  const platforms = new Set<string>();

  for (const record of records) {
    for (const domain of record.domains) {
      domains.add(domain);
    }

    for (const platform of record.platforms) {
      platforms.add(platform);
    }
  }

  return {
    patternsTracked: records.length,
    domainsRepresented: domains.size,
    platformsRepresented: platforms.size,
    reviewsContributingLabel: "50–120 reviews",
    minimumTenantThreshold: PATTERN_LIBRARY_MINIMUM_TENANT_THRESHOLD,
    lastUpdatedUtc: PATTERN_LIBRARY_LAST_UPDATED_UTC,
  };
}

export function resolvePatternLibraryRecords(
  apiPatternKeys: readonly string[],
  useSampleCatalog: boolean,
): PatternLibraryRecord[] {
  if (useSampleCatalog) {
    return [...PATTERN_LIBRARY_SAMPLE_CATALOG];
  }

  if (apiPatternKeys.length === 0) {
    return [];
  }

  const matched = apiPatternKeys
    .map((key) => PATTERN_LIBRARY_SAMPLE_CATALOG.find((record) => record.patternKey === key))
    .filter((record): record is PatternLibraryRecord => record !== undefined);

  if (matched.length === 0) {
    return [...PATTERN_LIBRARY_SAMPLE_CATALOG];
  }

  return matched;
}
