export const CTO_DEMO_DATA_HANDLING_OPEN_PARAM = "dataHandlingOpen";

export function parseCtoDemoDataHandlingOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function ctoDemoDataHandlingDialogHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(CTO_DEMO_DATA_HANDLING_OPEN_PARAM);
  } else {
    params.set(CTO_DEMO_DATA_HANDLING_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
