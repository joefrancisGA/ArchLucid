import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import { PILOT_FEEDBACK_HELP_CANONICAL_PATH } from "@/lib/pilot-feedback-help-evidence-copy";
import { PILOT_GUIDE_HELP_PATH } from "@/lib/pilot-guide-help-guide-content";

export const PILOT_FEEDBACK_HELP_PAGE_TITLE = "Pilot feedback (internal runbook)";

export const PILOT_FEEDBACK_HELP_PAGE_SUBTITLE =
  "Admin guide for human judgment signals on findings and architecture reviews — not recommendation learning.";

export const PILOT_FEEDBACK_HELP_OVERVIEW =
  "Use this runbook when product or architecture owners triage how ArchLucid outputs are received during a pilot. Capture signals in reviews, open the Pilot feedback dashboard, then rank improvement opportunities before exporting triage summaries.";

export const PILOT_FEEDBACK_HELP_PRIMARY_ACTION = {
  label: "Open Pilot feedback",
  href: PRODUCT_LEARNING_PATH,
} as const;

/** First-viewport Admin workflow (TB-1720). */
export const PILOT_FEEDBACK_HELP_WORKFLOW_STEPS = [
  "Capture judgment signals on findings, artifacts, and sponsor packages during architecture reviews.",
  "Open Pilot feedback to review summary counts, trends, and the triage queue for your scope.",
  "Triage top improvement opportunities and export summaries for product or architecture follow-up.",
] as const;

/** Job split vs recommendation learning and workspace navigation (TB-1719). */
export const PILOT_FEEDBACK_HELP_JOB_MATRIX = [
  {
    label: "Pilot feedback (this guide)",
    href: PILOT_FEEDBACK_HELP_CANONICAL_PATH,
    when: "Cross-cutting human judgment on reviews, packages, and artifacts",
  },
  {
    label: "Pilot guide",
    href: PILOT_GUIDE_HELP_PATH,
    when: "Workspace navigation, first review path, and pilot orientation",
  },
  {
    label: "AI recommendation learning",
    href: "/internal/recommendation-learning",
    when: "Advisory acceptance weights and ranking-profile ops",
  },
  {
    label: "Improvement planning",
    href: "/insights/improvement-planning",
    when: "Named themes and plans after opportunities are triaged",
  },
] as const;

export const PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS = {
  startReview: {
    label: "Start a review",
    href: "/architecture/reviews/new",
  },
  pilotGuide: {
    label: "Pilot guide",
    href: inAppHelpHref("pilot-guide"),
  },
} as const;
