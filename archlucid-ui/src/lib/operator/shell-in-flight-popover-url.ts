import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SHELL_IN_FLIGHT_POPOVER_OPEN_PARAM = "inFlightOpen";

export function parseShellInFlightPopoverOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function shellInFlightPopoverHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SHELL_IN_FLIGHT_POPOVER_OPEN_PARAM);
}
