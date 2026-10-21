import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ENTERPRISE_INLINE_ERROR_DIAGNOSTICS_OPEN_PARAM = "enterpriseInlineErrorDiagnosticsOpen";

export function parseEnterpriseInlineErrorDiagnosticsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function enterpriseInlineErrorDiagnosticsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ENTERPRISE_INLINE_ERROR_DIAGNOSTICS_OPEN_PARAM);
}
