/** Inbox column label for legacy jobs without a parent architecture (AO-49 / CA-18). */
export const WORKING_UNLINKED_REVIEW_INBOX_LABEL = "Unlinked review" as const;

export const WORKING_UNLINKED_REVIEW_HONESTY_TITLE =
  "This review is not linked to an architecture desk" as const;

export const WORKING_UNLINKED_REVIEW_HONESTY_COPY =
  "Link or backfill this job from operator tools before treating it as a complete architecture desk. ArchLucid will not invent a parent from system name on read." as const;

export function isUnlinkedArchitectureReviewJob(architectureId: string | null | undefined): boolean {
  return (architectureId?.trim() ?? "").length === 0;
}
