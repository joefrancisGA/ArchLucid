import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const OPERATOR_HOME_ADVANCED_GUIDANCE_OPEN_PARAM = "operatorHomeAdvancedGuidanceOpen";

export function parseOperatorHomeAdvancedGuidanceOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function operatorHomeAdvancedGuidanceDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, OPERATOR_HOME_ADVANCED_GUIDANCE_OPEN_PARAM);
}
