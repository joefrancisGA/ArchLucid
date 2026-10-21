import {
  GROUNDING_FILTER_OPTIONS,
  ORIGIN_FILTER_OPTIONS,
} from "@/components/findings/run-detail-findings-toolbar-presentation";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (origin === "all") {
      params.delete(FINDINGS_ORIGIN_FILTER_PARAM);
    } else {
      params.set(FINDINGS_ORIGIN_FILTER_PARAM, origin);
    }
    },
  });
}

export function findingsGroundingFilterHrefFromSearch(
  currentSearch: string,
  pathname: string,
  grounding: FindingGroundingFilter,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (grounding === "all") {
      params.delete(FINDINGS_GROUNDING_FILTER_PARAM);
    } else {
      params.set(FINDINGS_GROUNDING_FILTER_PARAM, grounding);
    }
    },
  });
}
