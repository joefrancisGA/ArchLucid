export const OPERATOR_SAVED_VIEW_ID_PARAM = "viewId";

export function parseOperatorSavedViewIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function operatorSavedViewHrefFromSearch(
  currentSearch: string,
  viewId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (viewId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(OPERATOR_SAVED_VIEW_ID_PARAM);
  } else {
    params.set(OPERATOR_SAVED_VIEW_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
