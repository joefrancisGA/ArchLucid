import { SIGNED_RECORDS_LIST_PAGE_SUBTITLE } from "./signed-records-list-copy";

export const SIGNED_RECORDS_LIST_PAGE_SUBTITLE_BUYER =
  "Review finalized packages from completed architecture reviews — filter by review, then open a row for record details.";

export function signedRecordsListPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? SIGNED_RECORDS_LIST_PAGE_SUBTITLE_BUYER : SIGNED_RECORDS_LIST_PAGE_SUBTITLE;
}

export const SIGNED_RECORDS_LIST_LOADING_STATUS = "Loading finalized review records…";
