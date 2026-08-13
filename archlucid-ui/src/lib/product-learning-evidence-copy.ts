import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PRODUCT_LEARNING_CANONICAL_PATH = PRODUCT_LEARNING_PATH;

export const PRODUCT_LEARNING_HELP_TOPIC_LABEL = "How pilot feedback works" as const;

export const PRODUCT_LEARNING_CLAIM_DISCIPLINE =
  "Pilot feedback aggregates review signals for product improvement — ranked opportunities are candidates for human triage, not auto-filed work items, a signed-review diligence Sources package. Open Improvement planning or Architecture reviews when you need live workflow trails.";

export const PRODUCT_LEARNING_SOURCES_INTRO =
  "Use these follow-ups when feedback trends turn into planning themes, live reviews, or architect help.";


/** Operator Sources — no self-href to `/internal/product-learning`. */
export const PRODUCT_LEARNING_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Improvement planning", href: "/insights/improvement-planning" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Pilot feedback help", href: inAppHelpHref("pilot-feedback") },
  { label: "AI recommendation learning", href: "/internal/recommendation-learning" },
] as const;
