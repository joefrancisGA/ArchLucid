import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
/** Review-detail findings presentation: dense table (default Working) or card stack. */
export type ReviewFindingsListViewKind = "table" | "cards";

export const REVIEW_FINDINGS_LIST_VIEW_PARAM = "findingsListView";

const LIST_VIEW_ALLOWLIST: ReadonlySet<string> = new Set(["table", "cards"]);

export function parseReviewFindingsListViewFromSearch(
  raw: string | null | undefined,
): ReviewFindingsListViewKind | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!LIST_VIEW_ALLOWLIST.has(trimmed)) {
    return null;
  }

  return trimmed as ReviewFindingsListViewKind;
}

export function reviewFindingsListViewHrefFromSearch(
  currentSearch: string,
  view: ReviewFindingsListViewKind,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    params.set(REVIEW_FINDINGS_LIST_VIEW_PARAM, view);
    },
  });
}

export function defaultReviewFindingsListView(workingMode: boolean): ReviewFindingsListViewKind {
  return workingMode ? "table" : "cards";
}
