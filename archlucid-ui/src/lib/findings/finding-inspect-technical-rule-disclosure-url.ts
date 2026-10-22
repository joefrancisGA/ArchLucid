import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FINDING_INSPECT_TECHNICAL_RULE_OPEN_PARAM = "findingInspectTechnicalRuleOpen";

export function parseFindingInspectTechnicalRuleOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingInspectTechnicalRuleDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FINDING_INSPECT_TECHNICAL_RULE_OPEN_PARAM);
}
