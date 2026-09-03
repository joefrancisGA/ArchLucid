import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import type {
  PatternAdoptionSignal,
  PatternDomainFilter,
  PatternPlatformFilter,
  PatternRiskSignal,
  PatternTimeRangeFilter,
  PatternTypeFilter,
} from "@/lib/pattern-library-types";

export const PATTERN_LIBRARY_SEARCH_PARAM = "q";
export const PATTERN_LIBRARY_DOMAIN_PARAM = "domain";
export const PATTERN_LIBRARY_PLATFORM_PARAM = "platform";
export const PATTERN_LIBRARY_TYPE_PARAM = "type";
export const PATTERN_LIBRARY_RISK_PARAM = "risk";
export const PATTERN_LIBRARY_ADOPTION_PARAM = "adoption";
export const PATTERN_LIBRARY_TIME_PARAM = "time";

const PATTERN_DOMAIN_IDS = new Set<string>([
  "All domains",
  "Financial services",
  "Healthcare",
  "Public sector",
  "SaaS",
  "General",
  "Internal enterprise",
  "Other",
]);

const PATTERN_PLATFORM_IDS = new Set<string>([
  "All platforms",
  "AWS",
  "Azure",
  "GCP",
  "Multi-cloud",
  "Evidence-only",
]);

const PATTERN_TYPE_IDS = new Set<string>([
  "All types",
  "Connectivity",
  "Application",
  "Data",
  "Integration",
  "Security",
  "AI and knowledge",
  "Resilience",
  "Migration",
]);

const PATTERN_RISK_IDS = new Set<string>(["All risks", "Low", "Moderate", "High"]);

const PATTERN_ADOPTION_IDS = new Set<string>(["All adoption", "Common", "Emerging", "Rare", "Declining"]);

const PATTERN_TIME_IDS = new Set<string>(["All time", "Last 90 days", "Last 12 months"]);

export function parsePatternLibrarySearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parsePatternLibraryDomainFromSearch(raw: string | null | undefined): PatternDomainFilter {
  if (raw === null || raw === undefined) {
    return "All domains";
  }

  const trimmed = raw.trim();

  if (!PATTERN_DOMAIN_IDS.has(trimmed)) {
    return "All domains";
  }

  return trimmed as PatternDomainFilter;
}

export function parsePatternLibraryPlatformFromSearch(raw: string | null | undefined): PatternPlatformFilter {
  if (raw === null || raw === undefined) {
    return "All platforms";
  }

  const trimmed = raw.trim();

  if (!PATTERN_PLATFORM_IDS.has(trimmed)) {
    return "All platforms";
  }

  return trimmed as PatternPlatformFilter;
}

export function patternLibrarySearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = PATTERN_LIBRARY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(PATTERN_LIBRARY_SEARCH_PARAM);
  } else {
    params.set(PATTERN_LIBRARY_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function patternLibraryClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = PATTERN_LIBRARY_PATH,
): string {
  return patternLibrarySearchHrefFromSearch(currentSearch, "", pathname);
}

export function patternLibraryDomainHrefFromSearch(
  currentSearch: string,
  domain: PatternDomainFilter,
  pathname: string = PATTERN_LIBRARY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (domain === "All domains") {
    params.delete(PATTERN_LIBRARY_DOMAIN_PARAM);
  } else {
    params.set(PATTERN_LIBRARY_DOMAIN_PARAM, domain);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function patternLibraryPlatformHrefFromSearch(
  currentSearch: string,
  platform: PatternPlatformFilter,
  pathname: string = PATTERN_LIBRARY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (platform === "All platforms") {
    params.delete(PATTERN_LIBRARY_PLATFORM_PARAM);
  } else {
    params.set(PATTERN_LIBRARY_PLATFORM_PARAM, platform);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function parsePatternLibraryTypeFromSearch(raw: string | null | undefined): PatternTypeFilter {
  if (raw === null || raw === undefined) {
    return "All types";
  }

  const trimmed = raw.trim();

  if (!PATTERN_TYPE_IDS.has(trimmed)) {
    return "All types";
  }

  return trimmed as PatternTypeFilter;
}

export function parsePatternLibraryRiskFromSearch(
  raw: string | null | undefined,
): PatternRiskSignal | "All risks" {
  if (raw === null || raw === undefined) {
    return "All risks";
  }

  const trimmed = raw.trim();

  if (!PATTERN_RISK_IDS.has(trimmed)) {
    return "All risks";
  }

  return trimmed as PatternRiskSignal | "All risks";
}

export function patternLibraryTypeHrefFromSearch(
  currentSearch: string,
  patternType: PatternTypeFilter,
  pathname: string = PATTERN_LIBRARY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patternType === "All types") {
    params.delete(PATTERN_LIBRARY_TYPE_PARAM);
  } else {
    params.set(PATTERN_LIBRARY_TYPE_PARAM, patternType);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function patternLibraryRiskHrefFromSearch(
  currentSearch: string,
  risk: PatternRiskSignal | "All risks",
  pathname: string = PATTERN_LIBRARY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (risk === "All risks") {
    params.delete(PATTERN_LIBRARY_RISK_PARAM);
  } else {
    params.set(PATTERN_LIBRARY_RISK_PARAM, risk);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function parsePatternLibraryAdoptionFromSearch(
  raw: string | null | undefined,
): PatternAdoptionSignal | "All adoption" {
  if (raw === null || raw === undefined) {
    return "All adoption";
  }

  const trimmed = raw.trim();

  if (!PATTERN_ADOPTION_IDS.has(trimmed)) {
    return "All adoption";
  }

  return trimmed as PatternAdoptionSignal | "All adoption";
}

export function parsePatternLibraryTimeRangeFromSearch(raw: string | null | undefined): PatternTimeRangeFilter {
  if (raw === null || raw === undefined) {
    return "All time";
  }

  const trimmed = raw.trim();

  if (!PATTERN_TIME_IDS.has(trimmed)) {
    return "All time";
  }

  return trimmed as PatternTimeRangeFilter;
}

export function patternLibraryAdoptionHrefFromSearch(
  currentSearch: string,
  adoption: PatternAdoptionSignal | "All adoption",
  pathname: string = PATTERN_LIBRARY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (adoption === "All adoption") {
    params.delete(PATTERN_LIBRARY_ADOPTION_PARAM);
  } else {
    params.set(PATTERN_LIBRARY_ADOPTION_PARAM, adoption);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function patternLibraryTimeRangeHrefFromSearch(
  currentSearch: string,
  timeRange: PatternTimeRangeFilter,
  pathname: string = PATTERN_LIBRARY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (timeRange === "All time") {
    params.delete(PATTERN_LIBRARY_TIME_PARAM);
  } else {
    params.set(PATTERN_LIBRARY_TIME_PARAM, timeRange);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
