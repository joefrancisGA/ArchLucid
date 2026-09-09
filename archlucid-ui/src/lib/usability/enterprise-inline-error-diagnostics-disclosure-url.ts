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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ENTERPRISE_INLINE_ERROR_DIAGNOSTICS_OPEN_PARAM);
  } else {
    params.set(ENTERPRISE_INLINE_ERROR_DIAGNOSTICS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
