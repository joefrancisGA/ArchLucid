export const FINDING_ASK_INLINE_OPEN_PARAM = "findingAskInlineOpen";
export const FINDING_ASK_INLINE_FINDING_ID_PARAM = "findingAskInlineFindingId";

export function parseFindingAskInlineOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseFindingAskInlineFindingIdFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function findingAskInlineDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(FINDING_ASK_INLINE_OPEN_PARAM);
  } else {
    params.set(FINDING_ASK_INLINE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function findingAskInlineFindingIdDisclosureHrefFromSearch(
  currentSearch: string,
  findingId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (findingId === null || findingId.trim().length === 0) {
    params.delete(FINDING_ASK_INLINE_FINDING_ID_PARAM);
    params.delete(FINDING_ASK_INLINE_OPEN_PARAM);
  } else {
    params.set(FINDING_ASK_INLINE_FINDING_ID_PARAM, findingId.trim());
    params.delete(FINDING_ASK_INLINE_OPEN_PARAM);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
