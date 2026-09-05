export const SHELL_IN_FLIGHT_CANCEL_ID_PARAM = "inFlightCancelId";

export function parseShellInFlightCancelIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function shellInFlightCancelConfirmHrefFromSearch(
  currentSearch: string,
  operationId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (operationId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(SHELL_IN_FLIGHT_CANCEL_ID_PARAM);
  } else {
    params.set(SHELL_IN_FLIGHT_CANCEL_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
