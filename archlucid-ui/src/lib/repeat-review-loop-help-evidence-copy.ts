import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH = "/help/repeat-review-loop" as const;

export const REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE =
  "This repeat-review loop guide is operator orientation for compare, replay, and second-review proof - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Compare, Validate review, or Audit when you need live packages or assurance claims.";

export const REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO =
  "Use these follow-ups when stickiness guidance turns into comparing packages, starting the next review, or sponsor outcomes.";

export type RepeatReviewLoopHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/help/repeat-review-loop`. */
export const REPEAT_REVIEW_LOOP_HELP_SOURCES: readonly RepeatReviewLoopHelpSourceLink[] = [
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Start next review", href: "/architecture/reviews/new" },
  { label: "Validate review", href: "/internal/replay" },
  { label: "Your first architecture review", href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH },
  { label: "Pilot outcomes", href: "/insights/pilot-outcomes" },
  { label: "Review guide", href: inAppHelpHref("review-guide") },
] as const;
