import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SIMPLIFIED_PILOT_ADVANCED_CONFIG_OPEN_PARAM = "simplifiedPilotAdvancedConfigOpen";

export function parseSimplifiedPilotAdvancedConfigOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function simplifiedPilotAdvancedConfigDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SIMPLIFIED_PILOT_ADVANCED_CONFIG_OPEN_PARAM);
}
