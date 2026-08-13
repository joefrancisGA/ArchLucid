import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PILOT_GUIDE_HELP_CANONICAL_PATH = "/help/pilot-guide" as const;

export const PILOT_GUIDE_HELP_TOPIC_LABEL = "How the pilot guide works" as const;

export const PILOT_GUIDE_HELP_CLAIM_DISCIPLINE =
  "This pilot guide is architect orientation for running an evaluation pilot — it is not a signed-review diligence Sources package. Open Reviews, Audit, or Assurance status when you need live packages or assurance claims.";

export const PILOT_GUIDE_HELP_SOURCES_INTRO =
  "Use these follow-ups when pilot prep turns into starting a review, first-run onboarding, or sponsor outcomes.";


/** Operator Sources — no self-href to `/help/pilot-guide`. */
export const PILOT_GUIDE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Your first architecture review", href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH },
  { label: "First review guide", href: FIRST_REVIEW_GUIDE_PATH },
  { label: "Sponsor report", href: "/insights/sponsor-report" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
