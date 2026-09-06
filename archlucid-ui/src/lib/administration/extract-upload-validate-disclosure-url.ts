export const EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_OPEN_PARAM = "extractUploadValidateDisclosureOpen";

export function parseExtractUploadValidateDisclosureOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function extractUploadValidateDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_OPEN_PARAM);
  } else {
    params.set(EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
