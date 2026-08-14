import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export const SIGNED_RECORDS_LIST_PAGE_TITLE = "Sealed review records";

export const SIGNED_RECORDS_LIST_PAGE_SUBTITLE =
  "Browse finalized sealed review records across your workspace — open the source review or inspect the sealed record.";

export const SIGNED_RECORDS_LIST_EMPTY_TITLE = "No sealed review records yet";

export const SIGNED_RECORDS_LIST_EMPTY_BODY =
  "Sealed review records appear after you finalize an architecture review. Start a review, gather evidence, and finalize to create your first sealed record.";

export const SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL = BUYER_START_ARCHITECTURE_REVIEW_CTA;

export const SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL = "Browse reviews";

export const SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF = "/architecture/reviews";

export const SIGNED_RECORDS_LIST_TABLE_REVIEW_COLUMN = "Review";

export const SIGNED_RECORDS_LIST_TABLE_VERSION_COLUMN = "Version";

/**
 * The cell renders a date, and `manifestStatusForDisplay` maps API `Committed` to display
 * `Finalized`, so "Committed" here read as a status column in the API's vocabulary.
 */
export const SIGNED_RECORDS_LIST_TABLE_FINALIZED_COLUMN = "Finalized";

export const SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN = "Actions";

export const SIGNED_RECORDS_LIST_OPEN_RECORD_ACTION = "Open sealed record";

export const SIGNED_RECORDS_LIST_PAGINATION_ARIA_LABEL = "Sealed review records pagination";

export function formatSignedRecordsListPaginationSummary(
  page: number,
  shownCount: number,
  hasMore: boolean,
): string {
  const recordWord = shownCount === 1 ? "sealed record" : "sealed records";
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
