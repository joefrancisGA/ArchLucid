import type { ReviewFailureRecoveryGuidance } from "@/lib/resolve-review-failure-recovery-guidance";
import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import { formatReviewLastFailureCauseLine } from "@/components/resolve-run-detail-last-failure-summary";

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

/** Visible "What failed" line for terminal-failure Overview when probe corroboration differs from review outcome. */
export function resolveReviewFailureWhatFailedLine(
  lastFailureSummary: RunDetailLastFailureSummary | null | undefined,
  guidance: ReviewFailureRecoveryGuidance | null | undefined,
): string | null {
  const recordedCause = formatReviewLastFailureCauseLine(lastFailureSummary);

  if (recordedCause !== null) {
    return recordedCause;
  }

  const headline = normalizeCopy(guidance?.headline);

  if (headline.length > 0) {
    return headline;
  }

  const detail = normalizeCopy(guidance?.detail);

  return detail.length > 0 ? detail : null;
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

/** When the live probe succeeded, the AI panel owns availability copy — shorten the strip sentence. */
export function resolveProbeSucceededDoThisNextSentence(
  guidance: ReviewFailureRecoveryGuidance,
): string {
  const headline = normalizeCopy(guidance.headline);

  if (headline.length > 0) {
    return `${headline} — re-run the review to retry with the same intake.`;
  }

  return "Execution failed — re-run the review to retry with the same intake.";
}
