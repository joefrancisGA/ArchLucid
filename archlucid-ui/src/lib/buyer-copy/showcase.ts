/**
 * Customer Intake showcase specimen metadata — roles, policy pack, and residual risk.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { CUSTOMER_INTAKE_RULE_SET_VERSION } from "@/lib/samples/customer-intake-modernization/definition";

/** Residual-risk monitoring metadata for the Customer Intake showcase review. */
export const BUYER_SHOWCASE_RESIDUAL_RISK_OWNER = "Request owner";

export const BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE = "Weekly exception-volume sampling";

/** Months after package approval for the first scheduled residual-risk review. */
export const BUYER_SHOWCASE_RESIDUAL_RISK_FIRST_REVIEW_OFFSET_MONTHS = 1;

/** Annual roll-forward when the first review date has passed. */
export const BUYER_SHOWCASE_RESIDUAL_RISK_REVIEW_RECURRENCE_YEARS = 1;

export const BUYER_SHOWCASE_APPROVER_ROLE = "Architecture approver";

export const BUYER_SHOWCASE_REQUEST_OWNER_ROLE = "Request owner";

export const BUYER_SHOWCASE_POLICY_PACK_LABEL = policyPackBuyerLabel(
  "enterprise-privacy-v2",
  CUSTOMER_INTAKE_RULE_SET_VERSION,
);

export const BUYER_SHOWCASE_APPROVAL_UTC = "2026-01-14T22:05:00.000Z";

/** Post-approval finding lead when the parent review is finalized. */
export const BUYER_FINDING_POST_APPROVAL_LEAD =
  "Residual sensitive-data minimization risk accepted with monitoring as part of the finalized Customer Intake review.";

export const BUYER_FINDING_POST_APPROVAL_VALIDATION =
  "Recorded acceptance: ingress classification validated, adapter boundaries bounded, OCR bypass monitoring active, and weekly exception-volume review assigned to the residual-risk owner.";

function startOfUtcDay(date: Date): Date {
  const copy = new Date(date);

  copy.setUTCHours(0, 0, 0, 0);

  return copy;
}

function formatIsoDateUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addUtcMonths(date: Date, months: number): Date {
  const copy = new Date(date);

  copy.setUTCMonth(copy.getUTCMonth() + months);

  return startOfUtcDay(copy);
}

function addUtcYears(date: Date, years: number): Date {
  const copy = new Date(date);

  copy.setUTCFullYear(copy.getUTCFullYear() + years);

  return startOfUtcDay(copy);
}

/**
 * Next residual-risk review for the Customer Intake showcase — anchored to approval, then rolls
 * forward annually so buyer-polished surfaces never show a stale past date.
 */
export function resolveBuyerShowcaseResidualRiskNextReviewIso(referenceDate: Date = new Date()): string {
  const approval = startOfUtcDay(new Date(BUYER_SHOWCASE_APPROVAL_UTC));
  let nextReview = addUtcMonths(approval, BUYER_SHOWCASE_RESIDUAL_RISK_FIRST_REVIEW_OFFSET_MONTHS);
  const today = startOfUtcDay(referenceDate);

  while (nextReview.getTime() < today.getTime()) {
    nextReview = addUtcYears(nextReview, BUYER_SHOWCASE_RESIDUAL_RISK_REVIEW_RECURRENCE_YEARS);
  }

  return formatIsoDateUtc(nextReview);
}
