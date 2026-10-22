import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FINDING_POLICY_TRACE_EXCERPT_OPEN_PARAM = "findingPolicyTraceExcerptOpen";

export function parseFindingPolicyTraceExcerptOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingPolicyTraceExcerptDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FINDING_POLICY_TRACE_EXCERPT_OPEN_PARAM);
}
