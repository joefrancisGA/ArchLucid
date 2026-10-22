import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ASK_REVIEW_QUESTIONS_SOURCES_OPEN_PARAM = "askReviewQuestionsSourcesOpen";

export function parseAskReviewQuestionsSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function askReviewQuestionsSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ASK_REVIEW_QUESTIONS_SOURCES_OPEN_PARAM);
}
