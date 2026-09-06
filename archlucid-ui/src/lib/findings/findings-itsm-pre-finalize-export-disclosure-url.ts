export const FINDINGS_ITSM_PRE_FINALIZE_EXPORT_OPEN_PARAM = "findingsItsmPreFinalizeExportOpen";

export function parseFindingsItsmPreFinalizeExportOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingsItsmPreFinalizeExportDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(FINDINGS_ITSM_PRE_FINALIZE_EXPORT_OPEN_PARAM);
  } else {
    params.set(FINDINGS_ITSM_PRE_FINALIZE_EXPORT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
