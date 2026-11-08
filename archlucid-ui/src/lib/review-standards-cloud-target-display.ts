export const COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_STORED =
  "Cloud target was not stored." as const;

export const COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_STORED_EMPTY =
  "Cloud target was stored empty." as const;

export const COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_CHOSEN =
  "Cloud target was not chosen." as const;

/** Committed manifest / intake honesty for wizard `None` vs a stored hyperscaler choice. */
export function formatCommittedReviewStandardsCloudTarget(
  cloudProvider: string | null | undefined,
): string {
  if (cloudProvider === null || cloudProvider === undefined) {
    return COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_STORED;
  }

  const trimmed = cloudProvider.trim();

  if (trimmed.length === 0) {
    return COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_STORED_EMPTY;
  }

  if (trimmed.localeCompare("None", undefined, { sensitivity: "accent" }) === 0) {
    return COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_CHOSEN;
  }

  return trimmed;
}
