import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PRODUCT_LEARNING_CANONICAL_PATH = PRODUCT_LEARNING_PATH;

export const PRODUCT_LEARNING_CLAIM_DISCIPLINE =
  "Pilot feedback aggregates review signals for product improvement — ranked opportunities are candidates for human triage, not auto-filed work items, a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Improvement planning or Architecture reviews when you need live workflow trails.";

export const PRODUCT_LEARNING_SOURCES_INTRO =
  "Use these follow-ups when feedback trends turn into planning themes, live reviews, or operator help.";

export type ProductLearningSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/internal/product-learning`. */
export const PRODUCT_LEARNING_SOURCES: readonly ProductLearningSourceLink[] = [
  { label: "Improvement planning", href: "/insights/planning" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Pilot feedback help", href: inAppHelpHref("pilot-feedback") },
  { label: "AI recommendation learning", href: "/internal-operations/recommendation-learning" },
] as const;
