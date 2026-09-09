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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(BULK_EVIDENCE_UPLOAD_ERROR_DIAGNOSTICS_OPEN_PARAM);
  } else {
    params.set(BULK_EVIDENCE_UPLOAD_ERROR_DIAGNOSTICS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
