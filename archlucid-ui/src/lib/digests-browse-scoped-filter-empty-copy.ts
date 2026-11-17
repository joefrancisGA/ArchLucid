export const DIGESTS_BROWSE_SCOPED_REVIEW_FILTER_EMPTY_TITLE =
  "No generated digests for this review yet" as const;

export const DIGESTS_BROWSE_SCOPED_REVIEW_FILTER_EMPTY_DESCRIPTION =
  "The browse list loaded successfully but no architecture digests are stored for the scoped review id — this is not a failed digest read. Schedule or generate a digest from Get started, or clear review scope to browse the full history." as const;

export const DIGESTS_BROWSE_SCOPED_REVIEW_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE =
  "An empty scoped browse after a successful list load is not the same as a failed digest catalog read." as const;