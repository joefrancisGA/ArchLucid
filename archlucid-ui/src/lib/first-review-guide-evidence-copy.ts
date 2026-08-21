import { ARCHITECTURES_NEW_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const FIRST_REVIEW_GUIDE_CANONICAL_PATH = FIRST_REVIEW_GUIDE_PATH;

export const FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE =
  "This First review guide is onboarding checklist orientation — completing steps here does not create a full audit export. Start a review and Evidence intake when you are ready to file evidence.";

export const FIRST_REVIEW_GUIDE_SOURCES_INTRO =
  "Use these when you are ready to create a draft, start review intake, or need first-architecture-review help.";

/** Compact evaluation scope + duration expectation on `/architecture/first-review-guide` (ARF P0-6). */
export const FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER =
  "Evaluation applies your workspace policy pack and standards. Most first reviews with a brief and documents finish in 45–90 minutes; optional cloud inventory uploads often add 15–30 minutes.";


/** Operator Sources - no self-href to `/architecture/first-review-guide`. */
export const FIRST_REVIEW_GUIDE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Create architecture", href: ARCHITECTURES_NEW_PATH },
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Evidence intake help", href: inAppHelpHref("evidence-intake") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
