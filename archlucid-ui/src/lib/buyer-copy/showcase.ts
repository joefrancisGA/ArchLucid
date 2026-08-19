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

export const BUYER_SHOWCASE_RESIDUAL_RISK_NEXT_REVIEW = "2026-02-14";

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
