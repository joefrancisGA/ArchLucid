import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";

export const STANDARDS_RULES_SEARCH_PARAM = "q";
export const STANDARDS_RULES_SEVERITY_PARAM = "severity";
export const STANDARDS_RULES_LINKED_FINDINGS_PARAM = "linkedFindings";
export const STANDARDS_RULES_EVIDENCE_COVERAGE_PARAM = "evidenceCoverage";
export const STANDARDS_RULES_ENFORCEMENT_PARAM = "enforcement";

export type StandardsRulesLinkedFindingsFilter = "all" | "linked" | "unlinked";
export type StandardsRulesEvidenceCoverageFilter = "all" | "evidenced" | "unevidenced";

const LINKED_FINDINGS_IDS = new Set<string>(["all", "linked", "unlinked"]);
const EVIDENCE_COVERAGE_IDS = new Set<string>(["all", "evidenced", "unevidenced"]);

export function parseStandardsRulesSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parseStandardsRulesLinkedFindingsFromSearch(
  raw: string | null | undefined,
): StandardsRulesLinkedFindingsFilter {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!LINKED_FINDINGS_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as StandardsRulesLinkedFindingsFilter;
}

export function parseStandardsRulesSeverityFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return "all";
  }

  return trimmed;
}

export function standardsRulesSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = GOVERNANCE_STANDARDS_AND_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(STANDARDS_RULES_SEARCH_PARAM);
  } else {
    params.set(STANDARDS_RULES_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function standardsRulesClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = GOVERNANCE_STANDARDS_AND_RULES_PATH,
): string {
  return standardsRulesSearchHrefFromSearch(currentSearch, "", pathname);
}

export function standardsRulesLinkedFindingsHrefFromSearch(
  currentSearch: string,
  linkedFindings: StandardsRulesLinkedFindingsFilter,
  pathname: string = GOVERNANCE_STANDARDS_AND_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (linkedFindings === "all") {
    params.delete(STANDARDS_RULES_LINKED_FINDINGS_PARAM);
  } else {
    params.set(STANDARDS_RULES_LINKED_FINDINGS_PARAM, linkedFindings);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function standardsRulesSeverityHrefFromSearch(
  currentSearch: string,
  severity: string,
  pathname: string = GOVERNANCE_STANDARDS_AND_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = severity.trim();

  if (trimmed.length === 0 || trimmed === "all") {
    params.delete(STANDARDS_RULES_SEVERITY_PARAM);
  } else {
    params.set(STANDARDS_RULES_SEVERITY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function parseStandardsRulesEvidenceCoverageFromSearch(
  raw: string | null | undefined,
): StandardsRulesEvidenceCoverageFilter {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!EVIDENCE_COVERAGE_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as StandardsRulesEvidenceCoverageFilter;
}

export function parseStandardsRulesEnforcementFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return "all";
  }

  return trimmed;
}

export function standardsRulesEvidenceCoverageHrefFromSearch(
  currentSearch: string,
  evidenceCoverage: StandardsRulesEvidenceCoverageFilter,
  pathname: string = GOVERNANCE_STANDARDS_AND_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (evidenceCoverage === "all") {
    params.delete(STANDARDS_RULES_EVIDENCE_COVERAGE_PARAM);
  } else {
    params.set(STANDARDS_RULES_EVIDENCE_COVERAGE_PARAM, evidenceCoverage);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function standardsRulesEnforcementHrefFromSearch(
  currentSearch: string,
  enforcement: string,
  pathname: string = GOVERNANCE_STANDARDS_AND_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = enforcement.trim();

  if (trimmed.length === 0 || trimmed === "all") {
    params.delete(STANDARDS_RULES_ENFORCEMENT_PARAM);
  } else {
    params.set(STANDARDS_RULES_ENFORCEMENT_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
