import {
  humanReviewStatusDisplay,
  normalizeFindingHumanReviewStatus,
} from "@/lib/quick-decision-severity-labels";

/** Maps OpenAPI FindingHumanReviewStatus integers to operator-facing labels (TB-063). */
export function formatFindingHumanReviewStatusLabel(
  status: number | string | null | undefined,
  options?: { readonly stored?: boolean },
): string {
  const normalized = normalizeFindingHumanReviewStatus(status);

  return humanReviewStatusDisplay(normalized, options).label;
}

/** TB-987: ITSM inbound queue state is last-writer and separate from append-only disposition trail (TB-986). */
export const FINDING_ITSM_HUMAN_REVIEW_STATUS_CAPTION =
  "ITSM queue state (last inbound sync; separate from the disposition trail).";
