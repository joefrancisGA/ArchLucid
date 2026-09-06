export const APPROVAL_LINEAGE_RECORD_DIGEST_OPEN_PARAM = "approvalLineageRecordDigestOpen";

export function parseApprovalLineageRecordDigestOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function approvalLineageRecordDigestDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(APPROVAL_LINEAGE_RECORD_DIGEST_OPEN_PARAM);
  } else {
    params.set(APPROVAL_LINEAGE_RECORD_DIGEST_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
