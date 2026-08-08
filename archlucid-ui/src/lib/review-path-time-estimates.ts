/**
 * Display-only time estimates for review creation paths on `/architecture/reviews/new`.
 */

export type ReviewCreationPathId = "quick-review" | "guided-intake" | "detailed";

export type ReviewPathTimeEstimate = {
  pathId: ReviewCreationPathId;
  minutesLow: number;
  minutesHigh: number;
  outcome: string;
};

export const REVIEW_PATH_TIME_ESTIMATES: readonly ReviewPathTimeEstimate[] = [
  {
    pathId: "quick-review",
    minutesLow: 2,
    minutesHigh: 5,
    outcome: "to start a review",
  },
  {
    pathId: "guided-intake",
    minutesLow: 5,
    minutesHigh: 12,
    outcome: "Admission + required clarifications before execution",
  },
  {
    pathId: "detailed",
    minutesLow: 15,
    minutesHigh: 30,
    outcome: "Templates, evidence ZIP, Azure context, baseline metrics",
  },
];

export function reviewPathTimeEstimate(pathId: ReviewCreationPathId): ReviewPathTimeEstimate {
  const row = REVIEW_PATH_TIME_ESTIMATES.find((e) => e.pathId === pathId);

  if (row === undefined) {
    return REVIEW_PATH_TIME_ESTIMATES[0]!;
  }

  return row;
}

export function formatReviewPathTimeEstimate(pathId: ReviewCreationPathId): string {
  const row = reviewPathTimeEstimate(pathId);

  if (row.minutesLow === row.minutesHigh) {
    return `About ${row.minutesLow} min · ${row.outcome}`;
  }

  return `About ${row.minutesLow}–${row.minutesHigh} min · ${row.outcome}`;
}
