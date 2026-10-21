import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, APPROVAL_LINEAGE_RECORD_DIGEST_OPEN_PARAM);
}
