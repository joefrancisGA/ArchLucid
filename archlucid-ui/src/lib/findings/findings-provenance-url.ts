import {
  GROUNDING_FILTER_OPTIONS,
  ORIGIN_FILTER_OPTIONS,
} from "@/components/findings/run-detail-findings-toolbar-presentation";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";

export const FINDINGS_ORIGIN_FILTER_PARAM = "origin";
export const FINDINGS_GROUNDING_FILTER_PARAM = "grounding";

const ORIGIN_FILTER_IDS = new Set<string>(ORIGIN_FILTER_OPTIONS.map((option) => option.id));
const GROUNDING_FILTER_IDS = new Set<string>(GROUNDING_FILTER_OPTIONS.map((option) => option.id));

export function parseFindingsOriginFilterFromSearch(
  raw: string | null | undefined,
): FindingOriginFilter {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!ORIGIN_FILTER_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as FindingOriginFilter;
}

export function parseFindingsGroundingFilterFromSearch(
  raw: string | null | undefined,
): FindingGroundingFilter {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!GROUNDING_FILTER_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as FindingGroundingFilter;
}

export function findingsOriginFilterHrefFromSearch(
  currentSearch: string,
  pathname: string,
  origin: FindingOriginFilter,
): string {
  const params = new URLSearchParams(currentSearch);

  if (origin === "all") {
    params.delete(FINDINGS_ORIGIN_FILTER_PARAM);
  } else {
    params.set(FINDINGS_ORIGIN_FILTER_PARAM, origin);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function findingsGroundingFilterHrefFromSearch(
  currentSearch: string,
  pathname: string,
  grounding: FindingGroundingFilter,
): string {
  const params = new URLSearchParams(currentSearch);

  if (grounding === "all") {
    params.delete(FINDINGS_GROUNDING_FILTER_PARAM);
  } else {
    params.set(FINDINGS_GROUNDING_FILTER_PARAM, grounding);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
