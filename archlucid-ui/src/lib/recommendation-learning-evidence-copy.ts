import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";

export { RECOMMENDATION_LEARNING_CANONICAL_PATH };

export const RECOMMENDATION_LEARNING_CLAIM_DISCIPLINE =
  "Recommendation learning rebuilds ranking weights from historical advisory outcomes for operators — preview and rebuild are operational profile controls, not a signed-review diligence Sources package. Open Advisory scans or Pilot feedback when you need live recommendation or feedback trails.";

export const RECOMMENDATION_LEARNING_SOURCES_INTRO =
  "Use these follow-ups when profile eligibility, rebuild impact, or operator feedback needs a live workflow trail.";

export type RecommendationLearningSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/internal/recommendation-learning`. */
export const RECOMMENDATION_LEARNING_SOURCES: readonly RecommendationLearningSourceLink[] = [
  { label: "Advisory scans", href: "/governance/advisory-scans" },
  { label: "Pilot feedback", href: "/internal/product-learning" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Pilot feedback help", href: inAppHelpHref("pilot-feedback") },
  { label: "Audit", href: "/governance/audit" },
] as const;
