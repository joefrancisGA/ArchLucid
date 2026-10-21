import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const WORKSPACE_MODE_GRADUATION_OFFER_OPEN_PARAM = "graduationOfferOpen";

export function parseWorkspaceModeGraduationOfferOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function workspaceModeGraduationOfferPanelsHrefFromSearch(
  currentSearch: string,
  offerOpen: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, offerOpen, pathname, WORKSPACE_MODE_GRADUATION_OFFER_OPEN_PARAM);
}

/** True when the current query already encodes `offerOpen` — skip a no-op App Router replace. */
export function workspaceModeGraduationOfferUrlAlreadyMatches(
  currentSearch: string,
  offerOpen: boolean,
): boolean {
  const params = new URLSearchParams(currentSearch);

  return (
    parseWorkspaceModeGraduationOfferOpenFromSearch(params.get(WORKSPACE_MODE_GRADUATION_OFFER_OPEN_PARAM)) ===
    offerOpen
  );
}
