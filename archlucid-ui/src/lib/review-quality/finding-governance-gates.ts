import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";

export const DISPOSITION_RATIONALE_MIN_CHARS = 10;

export const DISPOSITION_RATIONALE_REQUIRED_MESSAGE =
  "Record why you are accepting, overriding, or waiving residual risk on this finding.";

export const RECOMMENDATION_ACTIONABILITY_REQUIRED_MESSAGE =
  "Expand the recommendation with evidence, an alternative, trade-off, effort, or validation step before applying the change.";

export const TRADE_OFF_ACKNOWLEDGMENT_REQUIRED_MESSAGE =
  "Name the trade-off you accept (for example cost, reliability, or security).";

export const APPROVED_DECISION_OVERRIDE_MESSAGE =
  "This change appears to reopen an approved decision. Record an explicit exception rationale or revise the proposal.";

/** TB-2305: Accept and reject-as-N/A require audit rationale; waiver uses its own field. */
export function dispositionRequiresRationale(disposition: FindingDispositionKind): boolean {
  return disposition === "Accepted" || disposition === "RejectedAsNotApplicable";
}

export function isDispositionRationaleSatisfied(rationale: string): boolean {
  return rationale.trim().length >= DISPOSITION_RATIONALE_MIN_CHARS;
}

/** TB-2304: one-line recommendations are not actionable apply targets. */
export function isRecommendationActionable(
  recommendation: string,
  recommendedActions: readonly string[],
): boolean {
  if (recommendedActions.length >= 2) {
    return true;
  }

  const text = recommendation.trim();

  if (text.length < 40) {
    return false;
  }

  if (text.length >= 100) {
    return true;
  }

  return /because|trade-?off|alternative|validate|effort|dependency|consequence/i.test(text);
}

/** TB-2320: accepting a finding with trade-offs requires explicit acknowledgment. */
export function dispositionRequiresTradeOffAcknowledgment(disposition: FindingDispositionKind): boolean {
  return disposition === "Accepted";
}

export function isTradeOffAcknowledgmentSatisfied(acknowledgment: string): boolean {
  return acknowledgment.trim().length >= DISPOSITION_RATIONALE_MIN_CHARS;
}

/** TB-2311: proposed remediations that reopen approved decisions need an exception path. */
export function proposedChangeOverridesApprovedDecision(
  proposedChange: string,
  approvedDecisionTitles: readonly string[],
): string | null {
  const lower = proposedChange.trim().toLowerCase();

  if (lower.length === 0) {
    return null;
  }

  for (const title of approvedDecisionTitles) {
    const normalized = title.trim();

    if (normalized.length >= 8 && lower.includes(normalized.toLowerCase())) {
      return normalized;
    }
  }

  return null;
}
