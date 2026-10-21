import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, QUICK_SCAN_SCOPE_DISCLOSURE_OPEN_PARAM);
}
