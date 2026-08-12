import { ARCHITECTURES_NEW_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const FIRST_REVIEW_GUIDE_CANONICAL_PATH = FIRST_REVIEW_GUIDE_PATH;

export const FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE =
  "This First review guide is onboarding checklist orientation - completing steps here does not by itself produce a signed-review diligence Sources package. Start a review and Evidence intake when you are ready to file evidence.";

export const FIRST_REVIEW_GUIDE_SOURCES_INTRO =
  "Use these follow-ups when the checklist leads to create-bootstrap, review intake, or first-architecture-review help.";


/** Operator Sources - no self-href to `/architecture/first-review-guide`. */
export const FIRST_REVIEW_GUIDE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Create architecture", href: ARCHITECTURES_NEW_PATH },
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Evidence intake help", href: inAppHelpHref("evidence-intake") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
