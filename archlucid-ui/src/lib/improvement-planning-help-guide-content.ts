import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import {
  IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING,
  IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL,
} from "@/lib/improvement-planning-help-evidence-copy";
import {
  IMPROVEMENT_PLANNING_DOWNLOAD_REPORT_CTA,
  IMPROVEMENT_PLANNING_EXPORT_DATA_CTA,
  IMPROVEMENT_PLANNING_VIEW_REVIEWS_HREF,
} from "@/lib/planning-page-copy";
import { PLANNING_PATH } from "@/lib/planning-route";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";

export const IMPROVEMENT_PLANNING_HELP_PAGE_TITLE = "Improvement planning";

export const IMPROVEMENT_PLANNING_HELP_PAGE_SUBTITLE =
  "Convert review feedback into recurring themes, prioritized improvement plans, and exportable summaries.";

export const IMPROVEMENT_PLANNING_HELP_OVERVIEW =
  "Improvement planning turns captured review feedback into recurring themes, prioritized improvement plans, and exportable summaries for architects and product triage.";

export const IMPROVEMENT_PLANNING_HELP_FEEDBACK_PRECONDITION =
  "Capture review feedback or record pilot feedback in product learning before themes and prioritized plans can be derived.";

/** Compact feedback tag beside the Start here primary action. */
export const IMPROVEMENT_PLANNING_HELP_FEEDBACK_PRECONDITION_TAG = "Captured feedback";

export const IMPROVEMENT_PLANNING_HELP_START_HERE_CARD_TITLE = "Start here";

export const IMPROVEMENT_PLANNING_HELP_PRIMARY_ACTION = {
  label: "Open improvement planning",
  href: PLANNING_PATH,
} as const;

export const IMPROVEMENT_PLANNING_HELP_THEMES_HREF = `${PLANNING_PATH}#planning-themes-heading` as const;

export const IMPROVEMENT_PLANNING_HELP_PLANS_HREF = `${PLANNING_PATH}#planning-plans-heading` as const;

export const IMPROVEMENT_PLANNING_HELP_EXPORT_HREF = `${PLANNING_PATH}#planning-export-section` as const;

export const IMPROVEMENT_PLANNING_HELP_EXPORT_REPORT_HREF = `${PLANNING_PATH}#planning-export-report` as const;

export const IMPROVEMENT_PLANNING_HELP_EXPORT_DATA_HREF = `${PLANNING_PATH}#planning-export-data` as const;

export type ImprovementPlanningHelpTileItem = {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
};

export const IMPROVEMENT_PLANNING_HELP_SHOW_TILE_ITEMS: readonly ImprovementPlanningHelpTileItem[] = [
  {
    label: "Themes",
    detail: "Recurring feedback patterns aggregate from captured review outcomes in the current scope.",
    href: IMPROVEMENT_PLANNING_HELP_THEMES_HREF,
  },
  {
    label: "Plans",
    detail: "Prioritized improvement plans group themes into actionable follow-up work.",
    href: IMPROVEMENT_PLANNING_HELP_PLANS_HREF,
  },
  {
    label: "Product learning",
    detail: "Record pilot feedback signals in product learning when pilots need aggregate triage before themes appear.",
    href: PRODUCT_LEARNING_PATH,
  },
  {
    label: "Reviews and findings",
    detail: "Open live reviews or findings when a plan needs linked evidence trails.",
    href: IMPROVEMENT_PLANNING_VIEW_REVIEWS_HREF,
  },
] as const;

export const IMPROVEMENT_PLANNING_HELP_OUTPUT_TILE_ITEMS: readonly ImprovementPlanningHelpTileItem[] = [
  {
    label: IMPROVEMENT_PLANNING_DOWNLOAD_REPORT_CTA,
    detail: "Download a shareable summary of themes and prioritized plans for stakeholders.",
    href: IMPROVEMENT_PLANNING_HELP_EXPORT_REPORT_HREF,
  },
  {
    label: IMPROVEMENT_PLANNING_EXPORT_DATA_CTA,
    detail: "Export planning metrics and plan rows when triage needs a structured handoff.",
    href: IMPROVEMENT_PLANNING_HELP_EXPORT_DATA_HREF,
  },
  {
    label: "Findings triage",
    detail: "Follow linked findings when a plan needs resolve follow-up.",
    href: GOVERNANCE_FINDINGS_PATH,
  },
] as const;

export const IMPROVEMENT_PLANNING_HELP_HOW_TO_READ_STEPS = [
  "Capture review feedback or record pilot feedback in product learning to generate themes.",
  "Open a theme or plan row to read status and linked review context.",
  "Return to reviews or findings when a plan needs execution or approval follow-up.",
] as const;

export const IMPROVEMENT_PLANNING_HELP_CLAIM_HEADING_ID = "help-improvement-planning-claim-discipline-heading" as const;

export const IMPROVEMENT_PLANNING_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-improvement-planning-shows", title: "What improvement planning shows" },
  { level: 2, id: "what-planning-returns", title: "What planning returns" },
  { level: 2, id: "how-improvement-planning-works", title: IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: IMPROVEMENT_PLANNING_HELP_CLAIM_HEADING_ID,
    title: IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns the audit-export negation once. */
export const IMPROVEMENT_PLANNING_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: [
    "not a full audit export",
    "sources package",
    "Sources package",
    "derived signal",
  ],
  claimMustContain: "not a full audit export",
} as const;
