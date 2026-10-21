import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const CTO_DEMO_DATA_HANDLING_OPEN_PARAM = "dataHandlingOpen";

export function parseCtoDemoDataHandlingOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function ctoDemoDataHandlingDialogHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, CTO_DEMO_DATA_HANDLING_OPEN_PARAM);
}
