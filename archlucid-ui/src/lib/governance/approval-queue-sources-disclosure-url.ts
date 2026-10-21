import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const APPROVAL_QUEUE_SOURCES_OPEN_PARAM = "approvalQueueSourcesOpen";

export function parseApprovalQueueSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function approvalQueueSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, APPROVAL_QUEUE_SOURCES_OPEN_PARAM);
}
