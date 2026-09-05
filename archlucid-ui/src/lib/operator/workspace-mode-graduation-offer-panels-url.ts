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
  const params = new URLSearchParams(currentSearch);

  if (!offerOpen) {
    params.delete(WORKSPACE_MODE_GRADUATION_OFFER_OPEN_PARAM);
  } else {
    params.set(WORKSPACE_MODE_GRADUATION_OFFER_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
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
