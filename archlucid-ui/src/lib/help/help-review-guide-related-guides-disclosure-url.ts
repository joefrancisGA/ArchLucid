import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_REVIEW_GUIDE_RELATED_GUIDES_OPEN_PARAM = "helpReviewGuideRelatedGuidesOpen";

export function parseHelpReviewGuideRelatedGuidesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpReviewGuideRelatedGuidesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_REVIEW_GUIDE_RELATED_GUIDES_OPEN_PARAM);
}
