import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture-scorecard-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS } from "@/lib/repeat-review-loop-help-guide-content";

export const REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH = "/help/repeat-review-loop" as const;

export const REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE =
  "This guide explains the repeat-review loop. For live architecture packages or assurance claims, open Compare, Validate review, or the audit trail.";

export const REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO =
  "Use these follow-ups when repeat-review guidance turns into sponsor outcomes, review workflow detail, or assurance trails.";

/** Navigable proof-column destinations for the stickiness signals table. */
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
    label: "Executive ROI summary export",
    href: "/insights/executive-summary",
  },
] as const;

/** Operator follow-ups — destinations not already in the Start the loop card. */
export const REPEAT_REVIEW_LOOP_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Compare and replay", href: inAppHelpHref("comparison-replay") },
  { label: "Pilot outcomes", href: "/insights/pilot-outcomes" },
  { label: "Review guide", href: inAppHelpHref("review-guide") },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
] as const;

export const REPEAT_REVIEW_LOOP_HELP_RELATED_HEADING = "Related help" as const;

/** Related help links — same labels as the diligence artifact index where they overlap. */
export const REPEAT_REVIEW_LOOP_HELP_RELATED: readonly EvidenceSourceLink[] = [
  { label: "Compare and replay", href: inAppHelpHref("comparison-replay") },
  { label: "Architecture packages", href: inAppHelpHref("review-packages") },
  { label: "Accelerator chooser", href: inAppHelpHref("accelerator-chooser") },
] as const;
