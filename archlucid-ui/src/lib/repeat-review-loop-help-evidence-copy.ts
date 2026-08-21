import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS } from "@/lib/repeat-review-loop-help-guide-content";
import {
  REPEAT_REVIEW_LOOP_HELP_RELATED_GUIDES,
  REPEAT_REVIEW_LOOP_HELP_RELATED_HEADING,
  repeatReviewLoopHelpRelatedGuides,
} from "@/lib/repeat-review-loop-help-related-guides";

export const REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH = "/help/repeat-review-loop" as const;

export const REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE =
  "This guide explains the repeat-review loop — open Compare, Validate review, or Audit when you need live architecture packages or assurance trails.";

export const REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const REPEAT_REVIEW_LOOP_HELP_CLAIM_HEADING_ID =
  "help-repeat-review-loop-claim-discipline-heading" as const;

export const REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO =
  "Use these follow-ups when repeat-review guidance turns into sponsor outcomes, review workflow detail, or assurance trails.";

/** Navigable proof-column destinations for the repeat-review signals table. */
export const REPEAT_REVIEW_LOOP_HELP_WHERE_YOU_SEE_IT: readonly EvidenceSourceLink[] = [
  {
    label: "Compare and prior package context",
    href: REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.compareReviews.href,
  },
  {
    label: "Product learning rollups",
    href: inAppHelpHref("pilot-feedback"),
  },
  {
    label: "Review duration metrics and pilot timing budget",
    href: ARCHITECTURE_SCORECARD_PATH,
  },
  {
    label: "Policy pack dry-run and enforce",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  {
    label: "Sponsor ROI summary export",
    href: "/insights/sponsor-report",
  },
] as const;

/** Operator follow-ups — destinations not already in the Start the loop card. */
export const REPEAT_REVIEW_LOOP_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Sponsor report", href: "/insights/sponsor-report" },
  { label: "Review guide", href: inAppHelpHref("review-guide") },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
] as const;

export const REPEAT_REVIEW_LOOP_HELP_RELATED: readonly EvidenceSourceLink[] =
  REPEAT_REVIEW_LOOP_HELP_RELATED_GUIDES;

export { REPEAT_REVIEW_LOOP_HELP_RELATED_HEADING, repeatReviewLoopHelpRelatedGuides };
