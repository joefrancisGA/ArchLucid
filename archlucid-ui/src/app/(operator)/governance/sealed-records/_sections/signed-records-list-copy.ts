import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export const SIGNED_RECORDS_LIST_PAGE_TITLE = "Sealed review records";

export const SIGNED_RECORDS_LIST_PAGE_SUBTITLE =
  "Browse finalized sealed review records across your workspace — open the source review or inspect the sealed record.";

export const SIGNED_RECORDS_LIST_LIST_LEAD =
  "Only architecture reviews with a finalized sealed review record appear here. Open a row to inspect the sealed record or jump to the source review.";

export const SIGNED_RECORDS_LIST_LAST_REFRESHED_PREFIX = "Last refreshed";

export const SIGNED_RECORDS_LIST_LOADING_STATUS = "Loading sealed review records…";

export function formatSignedRecordsListRecordCount(count: number): string {
  const word = count === 1 ? "sealed review record" : "sealed review records";

  return `${count} ${word}`;
}

export const SIGNED_RECORDS_LIST_EMPTY_TITLE = "No sealed review records yet";

export const SIGNED_RECORDS_LIST_EMPTY_BODY =
  "Reviews in progress are not listed here. Finalize an architecture review to create a sealed review record, or browse active reviews while you wait.";

export const SIGNED_RECORDS_LIST_EMPTY_SAMPLE_CTA = "View sample sealed record";

export const SIGNED_RECORDS_LIST_EMPTY_PRIMARY_LABEL = BUYER_START_ARCHITECTURE_REVIEW_CTA;

export const SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL = "Browse reviews";

export const SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF = "/architecture/reviews";

export const SIGNED_RECORDS_LIST_TABLE_REVIEW_COLUMN = "Review";

export const SIGNED_RECORDS_LIST_TABLE_VERSION_COLUMN = "Version";

/**
 * The cell renders a date, and `manifestStatusForDisplay` maps API `Committed` to display
 * `Finalized`, so "Committed" here read as a status column in the API's vocabulary.
 */
/** Seal timestamp from manifest `createdUtc` — not review start time. */
export const SIGNED_RECORDS_LIST_TABLE_FINALIZED_COLUMN = "Finalized";

export const SIGNED_RECORDS_LIST_TABLE_INTEGRITY_COLUMN = "Seal integrity";

export const SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN = "Actions";

export const SIGNED_RECORDS_LIST_SEAL_DETAILS_DISCLOSURE = "Seal details";

export const SIGNED_RECORDS_LIST_SEAL_DIGEST_LABEL = "Record digest";

export const SIGNED_RECORDS_LIST_RECORD_PENDING_RESOLUTION =
  "Record not yet resolved — the manifest id is still propagating.";

export const SIGNED_RECORDS_LIST_RECORD_SUMMARY_UNAVAILABLE =
  "Manifest metadata is temporarily unavailable — retry or open the source review.";

export const SIGNED_RECORDS_LIST_RECORD_NOT_FOUND =
  "Sealed record was not found — it may have been removed or is outside your scope.";

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

export function signedRecordsListRecordLookupFailureMessage(
  failure: "pending-resolution" | "summary-unavailable" | "not-found",
): string {
  if (failure === "pending-resolution") {
    return SIGNED_RECORDS_LIST_RECORD_PENDING_RESOLUTION;
  }

  if (failure === "not-found") {
    return SIGNED_RECORDS_LIST_RECORD_NOT_FOUND;
  }

  return SIGNED_RECORDS_LIST_RECORD_SUMMARY_UNAVAILABLE;
}

export const SIGNED_RECORDS_LIST_RETRY_RECORD_ACTION = "Retry";

export const SIGNED_RECORDS_LIST_VERSION_UNKNOWN = "—";

export const SIGNED_RECORDS_LIST_PAGE_PATH = SIGNED_RECORDS_LIST_PATH;
