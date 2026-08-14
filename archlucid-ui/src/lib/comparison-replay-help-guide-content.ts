import { findBlockedRouteEntry } from "@/lib/cto-demo-blocked-route-registry";
import { isDemoStrictNavigationRedirectsActive } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const COMPARISON_REPLAY_VALIDATE_REVIEW_PATH = "/internal/validate-route" as const;

export const COMPARISON_REPLAY_HELP_COMPARE_ACTION = {
  label: "Open Compare two reviews",
  href: "/insights/compare-two-reviews",
} as const;

export const COMPARISON_REPLAY_HELP_VALIDATE_ACTION = {
  label: `Open ${OPERATOR_NAV_LINK_LABELS.replayReview}`,
  href: COMPARISON_REPLAY_VALIDATE_REVIEW_PATH,
} as const;

export const COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS = {
  compareTwoReviews: COMPARISON_REPLAY_HELP_COMPARE_ACTION,
  validateReview: COMPARISON_REPLAY_HELP_VALIDATE_ACTION,
} as const;

export const COMPARISON_REPLAY_HELP_DECISION_PANEL_TITLE = "Choose your next step" as const;

/** TB-1639 — first-viewport compare vs replay job chrome before deferred markdown detail. */
export const COMPARISON_REPLAY_HELP_FIRST_VIEWPORT_TEST_ID = "help-comparison-replay-first-viewport";

export const COMPARISON_REPLAY_HELP_DECISION_PANEL_TEST_ID = "help-comparison-replay-decision-panel";

export const COMPARISON_REPLAY_HELP_DEFERRED_JOB_DETAIL_HEADING = "## When to compare";

export const COMPARISON_REPLAY_HELP_DECISION_COMPARE = {
  title: "Compare two reviews",
  summary:
    "Pick two finalized signed review records and generate a delta narrative for sponsors, reviewers, or governance.",
} as const;

export const COMPARISON_REPLAY_HELP_DECISION_VALIDATE = {
  title: OPERATOR_NAV_LINK_LABELS.replayReview,
  summary:
    "Replay (**Validate review** in the workspace) regenerates or re-exports a saved comparison record — optionally with drift verification — without re-running a full architecture review.",
} as const;

/** Buyer-safe compare vs replay decision flow — no API paths or internal identifiers. */
export const COMPARISON_REPLAY_HELP_DIAGRAM_SOURCE = `flowchart TD
  START([What do you need?])
  START --> Q1{Do you have a saved comparison record to regenerate or re-export?}
  Q1 -->|Yes| Q2{Need drift verification against the stored record?}
  Q1 -->|No| Q3{Need a delta narrative between two signed review records?}
  Q2 -->|Yes| VFY[Replay with verify]
  Q2 -->|No| RPL[Replay saved comparison]
  Q3 -->|Yes| CMP[Compare two reviews]
  Q3 -->|No| NR[Start a new architecture review]`;

export const COMPARISON_REPLAY_HELP_DIAGRAM_ACCESSIBLE_NAME =
  "Compare vs Validate review decision flow";

export const COMPARISON_REPLAY_HELP_DIAGRAM_TEXT_ALTERNATIVE =
  "Start from what you need. When you already have a saved comparison record, choose replay with verify when you need drift verification against that record, or replay saved comparison when you only need to regenerate or re-export. When you do not have a saved record but need a delta between two packages, open Compare two reviews. When neither applies, start a new architecture review.";

export const COMPARISON_REPLAY_HELP_DIAGRAM_DETAILS_SUMMARY = "Compare vs replay decision diagram";

export const COMPARISON_REPLAY_HELP_RELATED_GUIDES_HEADING = "## Related guides";

export function isComparisonReplayValidateReviewActionAvailable(): boolean {
  if (!isDemoStrictNavigationRedirectsActive()) {
    return true;
  }

  return findBlockedRouteEntry(COMPARISON_REPLAY_VALIDATE_REVIEW_PATH) === null;
}

export function comparisonReplayValidateReviewUnavailableCopy(): {
  readonly label: string;
  readonly description: string;
} | null {
  if (isComparisonReplayValidateReviewActionAvailable()) {
    return null;
  }

  const blocked = findBlockedRouteEntry(COMPARISON_REPLAY_VALIDATE_REVIEW_PATH);

  if (blocked === null) {
    return null;
  }

  return { label: blocked.label, description: blocked.description };
}
