import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { PLANNING_PATH } from "@/lib/planning-route";
import { IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL } from "@/lib/improvement-planning-help-evidence-copy";

export const IMPROVEMENT_PLANNING_HELP_PAGE_TITLE = "Improvement planning";

export const IMPROVEMENT_PLANNING_HELP_PAGE_SUBTITLE =
  "Convert review feedback into recurring themes, prioritized improvement plans, and exportable summaries.";

export const IMPROVEMENT_PLANNING_HELP_OVERVIEW =
  "Improvement planning turns captured review feedback into themes and prioritized plans for architects and product triage. It is derived signal — not a sealed-review diligence Sources package.";

export const IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION = {
  label: "Open improvement planning",
  href: PLANNING_PATH,
} as const;

export type ImprovementPlanningHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const IMPROVEMENT_PLANNING_HELP_TILE_ITEMS: readonly ImprovementPlanningHelpTileItem[] = [
  {
    label: "Themes",
    detail: "Recurring feedback patterns aggregate from captured review outcomes in the current scope.",
  },
  {
    label: "Plans",
    detail: "Prioritized improvement plans group themes into actionable follow-up work.",
  },
  {
    label: "Pilot feedback",
    detail: "Product-learning surfaces complement planning when pilots need aggregate signals.",
  },
  {
    label: "Reviews and findings",
    detail: "Open live reviews or findings when a plan needs governed evidence trails.",
  },
] as const;

export const IMPROVEMENT_PLANNING_HELP_HOW_TO_READ_STEPS = [
  "Capture review feedback or run pilot feedback analysis to generate themes.",
  "Open a theme or plan row to read status and linked review context.",
  "Return to reviews or findings when a plan needs execution or governance follow-up.",
] as const;

export const IMPROVEMENT_PLANNING_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-improvement-planning-shows", title: "What improvement planning shows" },
  { level: 2, id: "how-improvement-planning-works", title: IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
