import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const STANDARDS_RULES_APPROVAL_RECORD_DETAILS_OPEN_PARAM = "standardsRulesApprovalRecordDetailsOpen";

export function parseStandardsRulesApprovalRecordDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function standardsRulesApprovalRecordDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, STANDARDS_RULES_APPROVAL_RECORD_DETAILS_OPEN_PARAM);
}
