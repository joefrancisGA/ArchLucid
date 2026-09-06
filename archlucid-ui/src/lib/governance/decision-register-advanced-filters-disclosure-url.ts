import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";

export const DECISION_REGISTER_ADVANCED_FILTERS_OPEN_PARAM = "decisionRegisterAdvancedFiltersOpen";

export function parseDecisionRegisterAdvancedFiltersOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function decisionRegisterAdvancedFiltersDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = GOVERNANCE_DECISION_REGISTER_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(DECISION_REGISTER_ADVANCED_FILTERS_OPEN_PARAM);
  } else {
    params.set(DECISION_REGISTER_ADVANCED_FILTERS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
