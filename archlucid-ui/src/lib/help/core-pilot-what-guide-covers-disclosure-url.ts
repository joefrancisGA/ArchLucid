import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const CORE_PILOT_WHAT_GUIDE_COVERS_OPEN_PARAM = "corePilotWhatGuideCoversOpen";

export function parseCorePilotWhatGuideCoversOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function corePilotWhatGuideCoversDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, CORE_PILOT_WHAT_GUIDE_COVERS_OPEN_PARAM);
}
