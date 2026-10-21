import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SIMULATOR_MODE_CONFIRM_OPEN_PARAM = "simulatorModeConfirmOpen";

export function parseSimulatorModeConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function simulatorModeConfirmHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SIMULATOR_MODE_CONFIRM_OPEN_PARAM);
}
