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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(FINDING_INSPECT_TECHNICAL_RULE_OPEN_PARAM);
  } else {
    params.set(FINDING_INSPECT_TECHNICAL_RULE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
