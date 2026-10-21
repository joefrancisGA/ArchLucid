import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const FIRST_REVIEW_GUIDE_LEDGER_PARAM = "ledger";

export function parseFirstReviewGuideLedgerExpandedFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function firstReviewGuideLedgerHrefFromSearch(
  currentSearch: string,
  ledgerExpanded: boolean,
  pathname: string = FIRST_REVIEW_GUIDE_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!ledgerExpanded) {
      params.delete(FIRST_REVIEW_GUIDE_LEDGER_PARAM);
    } else {
      params.set(FIRST_REVIEW_GUIDE_LEDGER_PARAM, "1");
    }
    },
  });
}
