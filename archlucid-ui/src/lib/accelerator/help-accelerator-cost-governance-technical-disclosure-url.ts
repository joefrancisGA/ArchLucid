import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_ACCELERATOR_COST_GOVERNANCE_TECHNICAL_OPEN_PARAM = "helpAcceleratorCostGovernanceTechnicalOpen";

export function parseHelpAcceleratorCostGovernanceTechnicalOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpAcceleratorCostGovernanceTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_ACCELERATOR_COST_GOVERNANCE_TECHNICAL_OPEN_PARAM);
}
