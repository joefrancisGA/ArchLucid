export const DEV_TESTING_QUICK_SWITCH_OPEN_PARAM = "devTestingQuickSwitchOpen";

export function parseDevTestingQuickSwitchOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function devTestingQuickSwitchDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(DEV_TESTING_QUICK_SWITCH_OPEN_PARAM);
  } else {
    params.set(DEV_TESTING_QUICK_SWITCH_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
