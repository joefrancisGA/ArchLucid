import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const EVIDENCE_INTAKE_HELP_CANONICAL_PATH = "/help/evidence-intake" as const;

export const EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE =
  "This Start a review guide is operator orientation for evidence intake — it is not a signed-review diligence Sources package. Open New review, Reviews, or Audit when you need live packages or assurance claims.";

export const EVIDENCE_INTAKE_HELP_SOURCES_INTRO =
  "Use these follow-ups when intake guidance turns into starting a review, first-run walkthrough, or cloud attachment.";

export type EvidenceIntakeHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/evidence-intake`. */
export const EVIDENCE_INTAKE_HELP_SOURCES: readonly EvidenceIntakeHelpSourceLink[] = [
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Your first architecture review", href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH },
  { label: "First review guide", href: FIRST_REVIEW_GUIDE_PATH },
  { label: "Review guide", href: inAppHelpHref("review-guide") },
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
] as const;
