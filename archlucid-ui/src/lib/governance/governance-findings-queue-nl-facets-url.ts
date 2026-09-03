import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import type {
  FindingsNaturalLanguageFacets,
  FindingsNaturalLanguageSeverity,
  FindingsNaturalLanguageStatus,
} from "@/lib/findings/findings-natural-language-filter";
import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";

export const GOVERNANCE_FINDINGS_NL_SEVERITY_PARAM = "severity";
export const GOVERNANCE_FINDINGS_NL_STATUS_PARAM = "status";

const NL_SEVERITY_IDS = new Set<string>(["critical", "high", "medium", "low"]);
const NL_STATUS_IDS = new Set<string>(["open", "disposed"]);

export function parseGovernanceFindingsNlSeverityFromSearch(
  raw: string | null | undefined,
): FindingsNaturalLanguageSeverity | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!NL_SEVERITY_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as FindingsNaturalLanguageSeverity;
}

export function parseGovernanceFindingsNlStatusFromSearch(
  raw: string | null | undefined,
): FindingsNaturalLanguageStatus | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!NL_STATUS_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as FindingsNaturalLanguageStatus;
}

export function governanceFindingsNlFacetsFromSearchParams(searchParams: {
  get: (name: string) => string | null;
}): FindingsNaturalLanguageFacets {
  return {
    severity: parseGovernanceFindingsNlSeverityFromSearch(searchParams.get(GOVERNANCE_FINDINGS_NL_SEVERITY_PARAM)),
    status: parseGovernanceFindingsNlStatusFromSearch(searchParams.get(GOVERNANCE_FINDINGS_NL_STATUS_PARAM)),
    titleKeywords: [],
  };
}

export function governanceFindingsNlSeverityHrefFromSearch(
  currentSearch: string,
  severity: FindingsNaturalLanguageSeverity | null,
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (severity === null) {
    params.delete(GOVERNANCE_FINDINGS_NL_SEVERITY_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_NL_SEVERITY_PARAM, severity);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function governanceFindingsNlStatusHrefFromSearch(
  currentSearch: string,
  status: FindingsNaturalLanguageStatus | null,
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (status === null) {
    params.delete(GOVERNANCE_FINDINGS_NL_STATUS_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_NL_STATUS_PARAM, status);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function governanceFindingsNlFacetsHrefFromSearch(
  currentSearch: string,
  facets: FindingsNaturalLanguageFacets,
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  let href = governanceFindingsNlSeverityHrefFromSearch(currentSearch, facets.severity, pathname);

  href = governanceFindingsNlStatusHrefFromSearch(
    href.includes("?") ? href.split("?")[1] ?? "" : "",
    facets.status,
    pathname,
  );

  return href;
}

export function governanceFindingsClearNlFacetsHrefFromSearch(
  currentSearch: string,
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  return governanceFindingsNlFacetsHrefFromSearch(currentSearch, EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS, pathname);
}
