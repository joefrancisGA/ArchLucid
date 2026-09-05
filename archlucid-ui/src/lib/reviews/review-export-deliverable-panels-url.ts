export const REVIEW_DELIVERABLE_OPEN_PARAM = "deliverableOpen";
export const REVIEW_DELIVERABLE_AUDIENCE_PARAM = "deliverableAudience";

export const REVIEW_DELIVERABLE_AUDIENCE_VALUES = ["sponsor", "grc", "board"] as const;

export type ReviewDeliverableAudience = (typeof REVIEW_DELIVERABLE_AUDIENCE_VALUES)[number];

const REVIEW_DELIVERABLE_AUDIENCE_SET = new Set<string>(REVIEW_DELIVERABLE_AUDIENCE_VALUES);

export type ReviewExportDeliverablePanelsUrlState = {
  readonly open: boolean;
  readonly audience: ReviewDeliverableAudience | null;
};

export function parseReviewDeliverableOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseReviewDeliverableAudienceFromSearch(
  raw: string | null | undefined,
): ReviewDeliverableAudience | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!REVIEW_DELIVERABLE_AUDIENCE_SET.has(trimmed)) {
    return null;
  }

  return trimmed as ReviewDeliverableAudience;
}

export function reviewExportDeliverablePanelsHrefFromSearch(
  currentSearch: string,
  state: ReviewExportDeliverablePanelsUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.open) {
    params.delete(REVIEW_DELIVERABLE_OPEN_PARAM);
    params.delete(REVIEW_DELIVERABLE_AUDIENCE_PARAM);
  } else {
    params.set(REVIEW_DELIVERABLE_OPEN_PARAM, "1");

    if (state.audience === null) {
      params.delete(REVIEW_DELIVERABLE_AUDIENCE_PARAM);
    } else {
      params.set(REVIEW_DELIVERABLE_AUDIENCE_PARAM, state.audience);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
