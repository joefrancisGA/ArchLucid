import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS } from "@/lib/repeat-review-loop-help-guide-content";

export type RepeatReviewLoopHelpLoopStep = {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly ctaLabel: string;
  readonly secondaryHref?: string;
  readonly secondaryLabel?: string;
};

export const REPEAT_REVIEW_LOOP_HELP_LOOP_HEADING = "Recommended loop (after first finalize)" as const;

/** TB-1398 — buyer-safe loop steps with deep links into shipped compare, replay, governance, and proof surfaces. */
export const REPEAT_REVIEW_LOOP_HELP_LOOP_STEPS: readonly RepeatReviewLoopHelpLoopStep[] = [
  {
    stepNumber: 1,
    title: "Compare",
    description: "Diff two architecture packages in the architect workspace.",
    href: REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.compareReviews.href,
    ctaLabel: REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.compareReviews.label,
  },
  {
    stepNumber: 2,
    title: "Replay",
    description: "Reconstruct authority when investigating regressions on a finalized review.",
    href: "/internal/validate-route",
    ctaLabel: "Validate review",
  },
  {
    stepNumber: 3,
    title: "Reuse prior context",
    description: "Start a follow-up review when evidence evolves incrementally instead of from scratch.",
    href: inAppHelpHref("prior-manifest-retrieval"),
    ctaLabel: "Prior package context",
    secondaryHref: REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.startNextReview.href,
    secondaryLabel: REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.startNextReview.label,
  },
  {
    stepNumber: 4,
    title: "Governance dry-run",
    description: "Exercise policy packs in dry-run before enforcing a blocking finalize gate.",
    href: GOVERNANCE_POLICY_PACKS_PATH,
    ctaLabel: "Open policy packs",
    secondaryHref: inAppHelpHref("governance-approval"),
    secondaryLabel: "Governance approval guide",
  },
  {
    stepNumber: 5,
    title: "Collect proof",
    description: "Refresh export-ready ROI and proof labels on the second finalized package.",
    href: "/insights/sponsor-report",
    ctaLabel: "Sponsor report",
    secondaryHref: "/insights/roi-summary",
    secondaryLabel: "ROI summary",
  },
] as const;

export function repeatReviewLoopHelpLoopSteps(): readonly RepeatReviewLoopHelpLoopStep[] {
  return REPEAT_REVIEW_LOOP_HELP_LOOP_STEPS;
}
