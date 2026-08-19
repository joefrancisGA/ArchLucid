/**
 * TB-2357 — Single lifecycle verb map: Finalize (action) / Finalized (state) / Sealed review record (artifact).
 * Customer chrome must not show API field names such as `committed`.
 */

export const REVIEW_LIFECYCLE_FINALIZE_ACTION_LABEL = "Finalize review" as const;

export const REVIEW_LIFECYCLE_FINALIZED_STATE_LABEL = "Finalized" as const;

export const REVIEW_LIFECYCLE_SEALED_ARTIFACT_LABEL = "Sealed review record" as const;

/** Banned in buyer-facing chrome — use {@link REVIEW_LIFECYCLE_FINALIZED_STATE_LABEL}. */
export const REVIEW_LIFECYCLE_BANNED_COMMITTED_CHROME = /\bcommitted\b/i;

export type FormatFinalizedReviewPackagesOutcomeInput = {
  readonly finalizedCount: number;
  readonly activeCount: number;
};

/**
 * Home / stickiness one-line package counts — never prints `committed`.
 */
export function formatFinalizedReviewPackagesOutcome(
  input: FormatFinalizedReviewPackagesOutcomeInput,
): string {
  const finalized = Number.isFinite(input.finalizedCount)
    ? Math.max(0, Math.trunc(input.finalizedCount))
    : 0;
  const active = Number.isFinite(input.activeCount)
    ? Math.max(0, Math.trunc(input.activeCount))
    : 0;

  if (active > 0) {
    return `${finalized} finalized · ${active} active`;
  }

  return `${finalized} finalized`;
}
