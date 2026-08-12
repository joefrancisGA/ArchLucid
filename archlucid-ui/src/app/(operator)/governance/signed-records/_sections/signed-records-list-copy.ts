import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export const SIGNED_RECORDS_LIST_PAGE_TITLE = "Signed review records";

export const SIGNED_RECORDS_LIST_PAGE_SUBTITLE =
  "Browse finalized signed review records across your workspace — open the source review or inspect the signed record.";

export const SIGNED_RECORDS_LIST_EMPTY_TITLE = "No signed review records yet";

export const SIGNED_RECORDS_LIST_EMPTY_BODY =
  "Signed review records appear after you finalize an architecture review. Start a review, gather evidence, and finalize to create your first signed record.";

export const SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL = BUYER_START_ARCHITECTURE_REVIEW_CTA;

export const SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL = "Browse reviews";

export const SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF = "/architecture/reviews";

export const SIGNED_RECORDS_LIST_TABLE_REVIEW_COLUMN = "Review";

export const SIGNED_RECORDS_LIST_TABLE_VERSION_COLUMN = "Version";

export const SIGNED_RECORDS_LIST_TABLE_COMMITTED_COLUMN = "Committed";

export const SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN = "Actions";

export const SIGNED_RECORDS_LIST_OPEN_RECORD_ACTION = "Open signed record";

export const SIGNED_RECORDS_LIST_PAGINATION_ARIA_LABEL = "Signed review records pagination";

export function formatSignedRecordsListPaginationSummary(
  page: number,
  shownCount: number,
  hasMore: boolean,
): string {
  const recordWord = shownCount === 1 ? "signed record" : "signed records";
  const shown = `Showing ${shownCount} ${recordWord}`;

  if (hasMore) {
    return `Page ${page} · ${shown} · more available`;
  }

  return `Page ${page} · ${shown}`;
}

export const SIGNED_RECORDS_LIST_RECORD_UNAVAILABLE_LABEL = "Record unavailable";

export const SIGNED_RECORDS_LIST_RETRY_RECORD_ACTION = "Retry";

export const SIGNED_RECORDS_LIST_VERSION_UNKNOWN = "—";

export const SIGNED_RECORDS_LIST_PAGE_PATH = SIGNED_RECORDS_LIST_PATH;
