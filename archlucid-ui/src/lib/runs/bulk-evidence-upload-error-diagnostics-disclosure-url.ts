import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const BULK_EVIDENCE_UPLOAD_ERROR_DIAGNOSTICS_OPEN_PARAM = "bulkEvidenceUploadErrorDiagnosticsOpen";

export function parseBulkEvidenceUploadErrorDiagnosticsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function bulkEvidenceUploadErrorDiagnosticsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, BULK_EVIDENCE_UPLOAD_ERROR_DIAGNOSTICS_OPEN_PARAM);
}
