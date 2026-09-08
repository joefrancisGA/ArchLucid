export const OPERATOR_INVENTORY_ROW_OVERFLOW_ID_PARAM = "operatorInventoryRowOverflowId";

export function parseOperatorInventoryRowOverflowIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function operatorInventoryRowOverflowDisclosureHrefFromSearch(
  currentSearch: string,
  overflowRowId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (overflowRowId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(OPERATOR_INVENTORY_ROW_OVERFLOW_ID_PARAM);
  } else {
    params.set(OPERATOR_INVENTORY_ROW_OVERFLOW_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
