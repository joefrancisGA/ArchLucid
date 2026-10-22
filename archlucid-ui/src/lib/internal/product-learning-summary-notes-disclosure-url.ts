import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const PRODUCT_LEARNING_SUMMARY_NOTES_OPEN_PARAM = "productLearningSummaryNotesOpen";

export function parseProductLearningSummaryNotesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function productLearningSummaryNotesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, PRODUCT_LEARNING_SUMMARY_NOTES_OPEN_PARAM);
}
