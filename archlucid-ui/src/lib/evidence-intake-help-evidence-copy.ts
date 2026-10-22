import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const EVIDENCE_INTAKE_HELP_CANONICAL_PATH = "/help/evidence-intake" as const;

export const EVIDENCE_INTAKE_HELP_TOPIC_LABEL = "How to start a review" as const;

export const EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE =
  "This guide is orientation only — it does not create or modify a review record.";

export const EVIDENCE_INTAKE_HELP_PRIMARY_ACTION = {
  label: START_REVIEW_LABEL,
  href: REVIEWS_NEW_PATH,
  testId: "help-evidence-intake-start-review",
} as const;

export const EVIDENCE_INTAKE_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const EVIDENCE_INTAKE_HELP_SOURCES_INTRO =
  "Use these follow-ups when intake steps turn into review guides, cloud attachment, or package verification.";

/** Operator Sources — related guides without self-href to `/help/evidence-intake`. */
export const EVIDENCE_INTAKE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Review guide", href: inAppHelpHref("review-guide") },
  { label: "Cloud connections", href: inAppHelpHref("cloud-connections") },
  { label: "Architecture packages", href: inAppHelpHref("review-packages") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
] as const;
