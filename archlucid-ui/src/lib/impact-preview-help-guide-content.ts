import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { IMPACT_PREVIEW_CANONICAL_PATH } from "@/lib/impact-preview-evidence-copy";
import { IMPACT_PREVIEW_HELP_TOPIC_LABEL } from "@/lib/impact-preview-help-evidence-copy";

export const IMPACT_PREVIEW_HELP_PAGE_TITLE = "Impact preview";

export const IMPACT_PREVIEW_HELP_PAGE_SUBTITLE =
  "Estimate before-and-after effects of proposed architecture changes against a finalized review baseline.";

export const IMPACT_PREVIEW_HELP_OVERVIEW =
  "Impact preview is review-time what-if analysis against a finalized baseline — not production observation and not a signed-review diligence Sources package by itself.";

export const IMPACT_PREVIEW_HELP_PRIMARY_ACTION = {
  label: "Open impact preview",
  href: IMPACT_PREVIEW_CANONICAL_PATH,
} as const;

export type ImpactPreviewHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const IMPACT_PREVIEW_HELP_TILE_ITEMS: readonly ImpactPreviewHelpTileItem[] = [
  {
    label: "Baseline review",
    detail: "Choose a finalized architecture review as the comparison baseline.",
  },
  {
    label: "Proposed change",
    detail: "Set the scope of the change you want to simulate against that baseline.",
  },
  {
    label: "Simulation results",
    detail: "Read estimated deltas before briefing sponsors or opening compare workflows.",
  },
  {
    label: "Compare and replay",
    detail: "Open compare when you need governed diff proof after the simulation.",
  },
] as const;

export const IMPACT_PREVIEW_HELP_HOW_TO_READ_STEPS = [
  "Select a finalized review baseline in the current workspace scope.",
  "Define the proposed change and run the impact preview simulation.",
  "Open reviews, planning, or compare when the simulation needs governed follow-up.",
] as const;

export const IMPACT_PREVIEW_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-impact-preview-shows", title: "What impact preview shows" },
  { level: 2, id: "how-impact-preview-works", title: IMPACT_PREVIEW_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
