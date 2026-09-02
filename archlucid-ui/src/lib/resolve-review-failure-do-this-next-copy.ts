import type { ReviewFailureRecoveryGuidance } from "@/lib/resolve-review-failure-recovery-guidance";

const PRE_STAGE_GENERIC_DETAIL =
  "The review stopped before processing began. This is usually a configuration or infrastructure issue — not missing intake fields. Check AI configuration, then re-run the review.";

function normalizeCopy(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/**
 * One above-fold sentence for ReviewPackageDoThisNextStrip — merges execution-failure headline,
 * reassurance, and the re-run CTA so operators are not asked to map "Assessment failed" to
 * "Execution failed" themselves.
 */
export function resolveReviewFailureDoThisNextSentence(
  guidance: ReviewFailureRecoveryGuidance,
): string {
  const headline = normalizeCopy(guidance.headline);
  const intactSummary = normalizeCopy(guidance.intactSummary);
  const detail = normalizeCopy(guidance.detail);

  if (intactSummary.length > 0) {
    const reassurance = intactSummary.includes("—")
      ? intactSummary.slice(intactSummary.indexOf("—") + 1).trim()
      : intactSummary;

    return `${headline} — ${reassurance} Follow the steps below, then re-run the review.`;
  }

  if (detail.length > 0 && detail !== PRE_STAGE_GENERIC_DETAIL) {
    return `${headline} — ${detail} Follow the steps below, then re-run the review.`;
  }

  return `${headline} — follow the steps below, then re-run the review with the same intake.`;
}

/** Finalize strip copy when execution failed — no cross-reference to the Do this next heading. */
export function resolveReviewFailureCommitBlockedReason(
  guidance: ReviewFailureRecoveryGuidance | null | undefined,
): string {
  const headline = normalizeCopy(guidance?.headline);

  if (headline.length > 0) {
    return `${headline} — re-run the review before finalizing.`;
  }

  return "Execution failed — re-run the review before finalizing.";
}

/** Detail lines that duplicate the combined Do this next sentence or intact summary. */
export function shouldShowReviewFailureRecoveryDetail(
  guidance: ReviewFailureRecoveryGuidance,
): boolean {
  const detail = normalizeCopy(guidance.detail);
  const intactSummary = normalizeCopy(guidance.intactSummary);

  if (detail.length === 0) {
    return false;
  }

  if (detail === PRE_STAGE_GENERIC_DETAIL) {
    return false;
  }

  if (intactSummary.length > 0 && detail === intactSummary) {
    return false;
  }

  return true;
}
