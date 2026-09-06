export const DIGESTS_TECHNICAL_DETAILS_OPEN_PARAM = "digestsTechnicalDetailsOpen";
export const DIGESTS_BROWSE_INCLUDES_OPEN_PARAM = "digestsBrowseIncludesOpen";

export type DigestsBrowseDisclosureUrlState = {
  readonly technicalDetailsOpen: boolean;
  readonly browseIncludesOpen: boolean;
};

function parseBooleanOpenParam(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseDigestsTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseDigestsBrowseIncludesOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function digestsBrowseDisclosureHrefFromSearch(
  currentSearch: string,
  state: DigestsBrowseDisclosureUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.technicalDetailsOpen) {
    params.delete(DIGESTS_TECHNICAL_DETAILS_OPEN_PARAM);
  } else {
    params.set(DIGESTS_TECHNICAL_DETAILS_OPEN_PARAM, "1");
  }

  if (!state.browseIncludesOpen) {
    params.delete(DIGESTS_BROWSE_INCLUDES_OPEN_PARAM);
  } else {
    params.set(DIGESTS_BROWSE_INCLUDES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
