export const SHELL_IN_FLIGHT_POPOVER_OPEN_PARAM = "inFlightOpen";

export function parseShellInFlightPopoverOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function shellInFlightPopoverHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SHELL_IN_FLIGHT_POPOVER_OPEN_PARAM);
  } else {
    params.set(SHELL_IN_FLIGHT_POPOVER_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
