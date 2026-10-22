import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const DEV_TESTING_QUICK_SWITCH_OPEN_PARAM = "devTestingQuickSwitchOpen";

export function parseDevTestingQuickSwitchOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function devTestingQuickSwitchDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, DEV_TESTING_QUICK_SWITCH_OPEN_PARAM);
}
