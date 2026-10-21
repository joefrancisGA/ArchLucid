import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FINDINGS_ITSM_PRE_FINALIZE_EXPORT_OPEN_PARAM);
}
