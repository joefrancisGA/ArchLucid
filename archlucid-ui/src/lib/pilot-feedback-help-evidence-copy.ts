import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PILOT_FEEDBACK_HELP_CANONICAL_PATH = "/help/pilot-feedback" as const;

export const PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE =
  "This pilot feedback guide orients architects on human judgment signals and product-learning triage — it is help orientation, not a signed-review diligence Sources package from your tenant. Open Pilot feedback or Improvement planning when you need live signal trails.";

export const PILOT_FEEDBACK_HELP_SOURCES_INTRO =
  "Use these follow-ups when pilot-feedback vocabulary turns into live triage dashboards, planning themes, or architecture reviews.";


/** Operator Sources — no self-href to `/help/pilot-feedback`. */
export const PILOT_FEEDBACK_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Pilot feedback", href: PRODUCT_LEARNING_PATH },
  { label: "Improvement planning", href: "/insights/improvement-planning" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "AI recommendation learning", href: "/internal/recommendation-learning" },
] as const;
