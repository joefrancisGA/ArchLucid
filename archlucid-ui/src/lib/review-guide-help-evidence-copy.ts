import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const REVIEW_GUIDE_HELP_CANONICAL_PATH = "/help/review-guide" as const;

export const REVIEW_GUIDE_HELP_TOPIC_LABEL = "How the review guide works" as const;

export const REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE =
  "This review guide is field reference for the architecture review wizard — not a full audit export. Open Reviews, Findings, or Audit when you need live records.";

export const REVIEW_GUIDE_HELP_SOURCES_INTRO =
  "Use these follow-ups when field reference turns into starting a review, first-run onboarding, or findings triage.";


/** Operator Sources — no self-href to `/help/review-guide`. */
export const REVIEW_GUIDE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "First review guide", href: FIRST_REVIEW_GUIDE_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
