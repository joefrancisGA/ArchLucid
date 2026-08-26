import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";

export const EVIDENCE_INTAKE_HELP_CANONICAL_PATH = "/help/evidence-intake" as const;

export const EVIDENCE_INTAKE_HELP_TOPIC_LABEL = "How to start a review" as const;

export const EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE =
  "This guide is orientation only — it does not create or modify a review record.";

export const EVIDENCE_INTAKE_HELP_PRIMARY_ACTION = {
  label: START_REVIEW_LABEL,
  href: REVIEWS_NEW_PATH,
  testId: "help-evidence-intake-start-review",
} as const;
