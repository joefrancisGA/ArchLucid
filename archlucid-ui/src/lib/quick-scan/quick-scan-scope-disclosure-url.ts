export const QUICK_SCAN_SCOPE_DISCLOSURE_OPEN_PARAM = "quickScanScopeDisclosureOpen";

export function parseQuickScanScopeDisclosureOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function quickScanScopeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(QUICK_SCAN_SCOPE_DISCLOSURE_OPEN_PARAM);
  } else {
    params.set(QUICK_SCAN_SCOPE_DISCLOSURE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
