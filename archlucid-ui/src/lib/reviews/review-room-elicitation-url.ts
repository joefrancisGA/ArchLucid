import { reviewDetailPath } from "@/lib/architecture/architecture-routes";

export const REVIEW_ROOM_ELICITATION_PARAM = "roomElicitation";

export function parseReviewRoomElicitationFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function readRoomElicitationFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  return parseReviewRoomElicitationFromSearch(searchParams.get(REVIEW_ROOM_ELICITATION_PARAM));
}

export function reviewRoomElicitationHrefFromSearch(
  currentSearch: string,
  roomElicitationActive: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!roomElicitationActive) {
    params.delete(REVIEW_ROOM_ELICITATION_PARAM);
  } else {
    params.set(REVIEW_ROOM_ELICITATION_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

/** Deep link into linked review room elicitation from architecture draft desk (DR-16). */
export function reviewDetailRoomElicitationHref(reviewId: string): string {
  const trimmedReviewId = reviewId.trim();

  if (trimmedReviewId.length === 0) {
    return reviewDetailPath(reviewId);
  }

  const params = new URLSearchParams();
  params.set(REVIEW_ROOM_ELICITATION_PARAM, "1");

  return `${reviewDetailPath(trimmedReviewId)}?${params.toString()}`;
}
