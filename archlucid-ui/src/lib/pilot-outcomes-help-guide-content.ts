import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { PILOT_OUTCOMES_HELP_TOPIC_LABEL } from "@/lib/pilot-outcomes-evidence-copy";
import {
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PAGE_SUBTITLE,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";

export { PILOT_OUTCOMES_HELP_TOPIC_LABEL };

export const PILOT_OUTCOMES_HELP_PAGE_TITLE = SPONSOR_REPORT_PAGE_TITLE;

export const PILOT_OUTCOMES_HELP_PAGE_SUBTITLE = SPONSOR_REPORT_PAGE_SUBTITLE;

export const PILOT_OUTCOMES_HELP_OVERVIEW =
  "The sponsor report summarizes finalized review activity, material findings, governance decisions, and measurable results for the selected reporting period. Use it for pilot close-out discussions — not as a signed-review diligence package by itself.";

export const PILOT_OUTCOMES_HELP_PRIMARY_ACTION = {
  label: "Open sponsor report",
  href: SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
} as const;

export type PilotOutcomesHelpReportItem = {
  readonly label: string;
  readonly detail: string;
};

export const PILOT_OUTCOMES_HELP_REPORT_ITEMS: readonly PilotOutcomesHelpReportItem[] = [
  {
    label: "Reporting period",
    detail: "Choose a UTC window that matches your pilot charter or sponsor review cadence.",
  },
  {
    label: "Finalized reviews",
    detail: "Counts and highlights from architecture reviews finalized in the period.",
  },
  {
    label: "Findings and governance",
    detail: "Material findings, governance decisions, and blocks that shaped pilot outcomes.",
  },
  {
    label: "Sibling sponsor reports",
    detail: "Open executive summary or ROI summary when packaging needs a broader narrative.",
  },
] as const;

export const PILOT_OUTCOMES_HELP_HOW_TO_READ_STEPS = [
  "Set the reporting period and apply it so tiles reflect the pilot window you intend to discuss.",
  "Review confidence and empty-state guidance before citing counts to sponsors or procurement.",
  "Open executive summary, ROI summary, or architecture scorecard when outcomes need sibling packaging.",
] as const;

export const PILOT_OUTCOMES_HELP_SIBLING_REPORTS = [
  {
    id: "executive-summary",
    title: "Executive value report",
    description: "Period preview of finalized reviews, governance activity, and sponsor exports.",
    actionLabel: "Open executive value report",
    href: SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  },
  {
    id: "roi-summary",
    title: "ROI summary",
    description: "Portfolio KPI framing for review-cycle reduction and directional savings.",
    actionLabel: "Open ROI summary",
    href: SPONSOR_REPORT_ROI_SUMMARY_PATH,
  },
  {
    id: "architecture-scorecard",
    title: "Architecture scorecard",
    description: "Workspace throughput tiles and directional savings for pilot discussions.",
    actionLabel: "Open architecture scorecard",
    href: ARCHITECTURE_SCORECARD_PATH,
  },
] as const;

export const PILOT_OUTCOMES_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-the-report-shows", title: "What the report shows" },
  { level: 2, id: "how-to-read-pilot-outcomes", title: PILOT_OUTCOMES_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
