/** Compare, replay, and validate review surfaces plus comparison-replay help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { COMPARE_CANONICAL_PATH } from "@/lib/compare-evidence-copy";
import {
  COMPARISON_REPLAY_HELP_CANONICAL_PATH,
  COMPARISON_REPLAY_HELP_TOPIC_LABEL,
} from "@/lib/comparison-replay-help-evidence-copy";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";

const COMPARE_TWO_REVIEWS_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Compare two finalized reviews to see what changed in scope, findings, decisions, approval, and evidence.",
  whatToDoNext:
    "Pick baseline and updated reviews, run Compare, then open Sources for each side before briefing sponsors.",
  whyEmpty: "Results appear after you compare two finalized reviews.",
  whereToConfigurePrerequisite: "Finalize at least two reviews in this workspace first.",
  taskSteps: [
    "Pick baseline and updated finalized reviews.",
    "Run Compare and review scope, findings, and decision diffs.",
    "Open Sources on each side before briefing sponsors.",
  ],
} as const;

const VALIDATE_REVIEW_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Validate review — re-check a finalized architecture review (reconstruct, rebuild outputs, or full regeneration).",
  whatToDoNext:
    "Pick a finalized review, choose a validation depth, run the check, then open the review or Compare when you need diffs.",
  whyEmpty: "Validation results appear after you run a check on a selected architecture review.",
  whereToConfigurePrerequisite: "Finalize at least one review in this workspace first; Admin Execute access may be required.",
  taskSteps: [
    "Pick a finalized review to validate.",
    "Choose validation depth and run the check.",
    "Open Compare when you need diffs against a prior baseline.",
  ],
} as const;

export const COMPARISON_REPLAY_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: COMPARE_CANONICAL_PATH,
    entry: COMPARE_TWO_REVIEWS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/replay",
    entry: VALIDATE_REVIEW_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: INTERNAL_REPLAY_PATH,
    entry: VALIDATE_REVIEW_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: COMPARISON_REPLAY_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        `Compare and replay — ${COMPARISON_REPLAY_HELP_TOPIC_LABEL.toLowerCase()} and when to open validate review.`,
      whatToDoNext:
        "Open Compare two reviews for a live pair diff, or Validate review when you need to re-check a finalized package.",
      whyEmpty: "This guide is always available; live compare and validate tools appear after you finalize architecture reviews.",
      whereToConfigurePrerequisite:
        "Pairwise compare needs two finalized reviews in this workspace; validate needs one finalized package.",
      whatToDoNextAction: {
        label: "Open Compare two reviews",
        href: COMPARE_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: COMPARISON_REPLAY_HELP_TOPIC_LABEL,
        href: INTERNAL_REPLAY_PATH,
      },
    },
  },
];
