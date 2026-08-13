import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";

export const EVIDENCE_INTAKE_HELP_CANONICAL_PATH = "/help/evidence-intake" as const;

export const EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE =
  "This Start a review guide is architect orientation for evidence intake — it is not a signed review record. Open New architecture review, Reviews, or Audit trail when you need live packages or assurance claims.";

export const EVIDENCE_INTAKE_HELP_PRIMARY_ACTION = {
  label: START_REVIEW_LABEL,
  href: REVIEWS_NEW_PATH,
  testId: "help-evidence-intake-start-review",
} as const;
