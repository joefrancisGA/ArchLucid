import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { IMPACT_PREVIEW_CANONICAL_PATH } from "@/lib/impact-preview-evidence-copy";
import {
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE_HEADING,
  IMPACT_PREVIEW_HELP_TOPIC_LABEL,
} from "@/lib/impact-preview-help-evidence-copy";
import {
  IMPACT_PREVIEW_PLANNING_HREF,
  IMPACT_PREVIEW_REVIEWS_HREF,
} from "@/lib/impact-preview-page-copy";

export const IMPACT_PREVIEW_HELP_PAGE_TITLE = "Impact preview";

export const IMPACT_PREVIEW_HELP_PAGE_SUBTITLE =
  "Estimate before-and-after effects of proposed architecture changes against a finalized review baseline.";

export const IMPACT_PREVIEW_HELP_OVERVIEW =
  "Impact preview re-evaluates findings, risk, cost, and approval impact when you simulate a proposed change against a finalized review baseline.";

export const IMPACT_PREVIEW_HELP_BASELINE_PRECONDITION =
  "Finalize an architecture review before running impact preview — simulations compare proposed changes against that finalized baseline.";

/** Compact baseline tag beside the Start here primary action. */
export const IMPACT_PREVIEW_HELP_BASELINE_PRECONDITION_TAG = "Finalized baseline";

export const IMPACT_PREVIEW_HELP_START_HERE_CARD_TITLE = "Start here";

export const IMPACT_PREVIEW_HELP_PRIMARY_ACTION = {
  label: "Open impact preview",
  href: IMPACT_PREVIEW_CANONICAL_PATH,
} as const;

export type ImpactPreviewHelpTileItem = {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
};

export const IMPACT_PREVIEW_HELP_INPUT_TILE_ITEMS: readonly ImpactPreviewHelpTileItem[] = [
  {
    label: "Baseline review",
    detail: "Choose a finalized architecture review as the comparison baseline.",
    href: IMPACT_PREVIEW_REVIEWS_HREF,
  },
  {
    label: "Proposed change",
    detail: "Set the scope of the change you want to simulate against that baseline.",
    href: IMPACT_PREVIEW_PLANNING_HREF,
  },
] as const;

export const IMPACT_PREVIEW_HELP_OUTPUT_TILE_ITEMS: readonly ImpactPreviewHelpTileItem[] = [
  {
    label: "Simulation results",
    detail: "Read estimated deltas before briefing sponsors or opening compare workflows.",
    href: IMPACT_PREVIEW_CANONICAL_PATH,
  },
  {
    label: "Compare and replay",
    detail: "Open compare when you need a side-by-side record of what changed.",
    href: "/insights/compare-two-reviews",
  },
] as const;

export const IMPACT_PREVIEW_HELP_HOW_TO_READ_STEPS = [
  "Select a finalized review baseline in the current workspace scope.",
  "Define the proposed change and run the impact preview simulation.",
  "Open reviews, planning, or compare when the simulation needs approved follow-up.",
] as const;

export const IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID = "help-impact-preview-claim-discipline-heading" as const;

export const IMPACT_PREVIEW_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-you-provide", title: "What you provide" },
  { level: 2, id: "what-impact-preview-returns", title: "What impact preview returns" },
  { level: 2, id: "how-impact-preview-works", title: IMPACT_PREVIEW_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID,
    title: IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns the diligence negation once. */
export const IMPACT_PREVIEW_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: [
    "not production observation",
    "not a full audit export",
    "sources package",
    "Sources package",
  ],
  claimMustContain: "not a full audit export",
} as const;
