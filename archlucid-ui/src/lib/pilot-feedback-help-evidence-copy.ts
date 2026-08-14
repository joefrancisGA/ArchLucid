import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export { PRODUCT_LEARNING_HELP_TOPIC_LABEL as PILOT_FEEDBACK_HELP_TOPIC_LABEL } from "@/lib/product-learning-evidence-copy";

export const PILOT_FEEDBACK_HELP_CANONICAL_PATH = "/help/pilot-feedback" as const;

export const PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE =
  "This guide orients architects on human judgment signals and product-learning triage — open Pilot feedback or Improvement planning when you need live signal trails.";

export const PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const PILOT_FEEDBACK_HELP_CLAIM_HEADING_ID = "help-pilot-feedback-claim-discipline-heading" as const;

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
