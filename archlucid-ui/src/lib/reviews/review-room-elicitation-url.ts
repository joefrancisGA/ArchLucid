import {
  architectureNestedFindingsPath,
  resolveArchitectureReviewHref,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";

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

/** Deep link into linked review room elicitation from architecture draft desk (DR-16 / AO-38). */
export function reviewDetailRoomElicitationHref(
  reviewId: string,
  architectureId?: string | null,
): string {
  const trimmedReviewId = reviewId.trim();

  if (trimmedReviewId.length === 0) {
    return reviewDetailPath(reviewId);
  }

  const params = new URLSearchParams();
  params.set(REVIEW_ROOM_ELICITATION_PARAM, "1");

  const base = resolveArchitectureReviewHref(trimmedReviewId, architectureId);

  return `${base}?${params.toString()}`;
}

/** IR-012 / IR-013 — Working room elicitation on the inhabited findings document. */
export function inhabitedFindingsRoomElicitationHref(
  architectureId: string,
  runId: string,
): string {
  const trimmedArchitectureId = architectureId.trim();
  const trimmedRunId = runId.trim();
  const params = new URLSearchParams();

  if (trimmedRunId.length > 0) {
    params.set("runId", trimmedRunId);
  }

  params.set(REVIEW_ROOM_ELICITATION_PARAM, "1");

  if (trimmedArchitectureId.length === 0) {
    return reviewDetailRoomElicitationHref(trimmedRunId);
  }

  const query = params.toString();

  return `${architectureNestedFindingsPath(trimmedArchitectureId)}?${query}`;
}

/** Working room handoff — nested findings when architecture is known; else review-detail room. */
export function resolveWorkingRoomElicitationHref(input: {
  readonly architectureId?: string | null;
  readonly runId: string;
}): string {
  const architectureId = input.architectureId?.trim() ?? "";
  const runId = input.runId.trim();

  if (architectureId.length > 0) {
    return inhabitedFindingsRoomElicitationHref(architectureId, runId);
  }

  return reviewDetailRoomElicitationHref(runId);
}
