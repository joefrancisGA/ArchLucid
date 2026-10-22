import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_BILLING_AND_PLANS_SOURCES_OPEN_PARAM = "helpBillingAndPlansSourcesOpen";

export function parseHelpBillingAndPlansSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpBillingAndPlansSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_BILLING_AND_PLANS_SOURCES_OPEN_PARAM);
}
