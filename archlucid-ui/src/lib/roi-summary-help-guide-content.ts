import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  ROI_SUMMARY_PAGE_SUBTITLE,
  roiSummaryBasisOfEstimateCopy,
  roiSummaryDirectionalDisclaimer,
  roiSummaryMethodologyFormula,
} from "@/lib/roi-summary-sponsor-presentation";
import {
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import {
  BASELINE_ROI_HEADING,
  BASELINE_ROI_WHY_TWO,
} from "@/lib/vocabulary/baseline-roi-vocabulary";
import {
  SCORECARD_ROI_HEADING,
  SCORECARD_ROI_WHY_TWO,
} from "@/lib/vocabulary/scorecard-roi-vocabulary";

export const ROI_SUMMARY_HELP_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.roiReport;

export const ROI_SUMMARY_HELP_PAGE_SUBTITLE = ROI_SUMMARY_PAGE_SUBTITLE;

export const ROI_SUMMARY_HELP_OVERVIEW =
  "ROI summary is the portfolio KPI view for review-cycle reduction, estimated effort saved, and governance-ready artifacts across a reporting window. Use it for sponsor value discussions — not financial reporting.";

export const ROI_SUMMARY_HELP_PRIMARY_ACTION = {
  label: "Open ROI summary",
  href: SPONSOR_REPORT_ROI_SUMMARY_PATH,
} as const;

export const ROI_SUMMARY_HELP_REPORT_SECTION_TITLE = "What the report shows";

export type RoiSummaryHelpReportItem = {
  readonly label: string;
  readonly detail: string;
};

export const ROI_SUMMARY_HELP_REPORT_ITEMS: readonly RoiSummaryHelpReportItem[] = [
  {
    label: "Rolling 30 days",
    detail: "A recent window for directional savings from finalized findings and governance blocks.",
  },
  {
    label: "Since pilot start",
    detail: "Pilot-to-date framing when you need cumulative value across the full pilot window.",
  },
  {
    label: "Hours saved",
    detail: "Estimated review and rework time avoided from severity-weighted findings and governance blocks.",
  },
  {
    label: "USD estimate",
    detail: "Directional dollar framing when loaded hourly cost and surfaced hours are sufficient.",
  },
] as const;

export const ROI_SUMMARY_HELP_HOW_TO_READ_STEPS = [
  "Pick the reporting window — rolling 30 days for recent activity or since pilot start for cumulative framing.",
  "Review confidence and data needs on the page before citing hours or dollars to sponsors.",
  "Open baseline settings when loaded hourly cost or review-cycle inputs need adjustment.",
] as const;

export const ROI_SUMMARY_HELP_DATA_NEEDS_SECTION_TITLE = "Data needs and confidence";

export const ROI_SUMMARY_HELP_DATA_NEEDS_ITEMS = [
  "At least one finalized review in the selected period.",
  "Findings with severity counts toward the hours model.",
  "Governance blocks or review-time baseline inputs sharpen the estimate.",
  "Loaded hourly cost unlocks a meaningful dollar estimate.",
] as const;

export const ROI_SUMMARY_HELP_METHODOLOGY_SECTION_TITLE = "Basis of estimate";

export const ROI_SUMMARY_HELP_METHODOLOGY_FORMULA = roiSummaryMethodologyFormula();

export const ROI_SUMMARY_HELP_METHODOLOGY_BODY = roiSummaryBasisOfEstimateCopy();

export const ROI_SUMMARY_HELP_DIRECTIONAL_DISCLAIMER = roiSummaryDirectionalDisclaimer();

export const ROI_SUMMARY_HELP_SCORECARD_SECTION_TITLE = SCORECARD_ROI_HEADING;

export const ROI_SUMMARY_HELP_SCORECARD_BODY = SCORECARD_ROI_WHY_TWO;

export const ROI_SUMMARY_HELP_BASELINE_SECTION_TITLE = BASELINE_ROI_HEADING;

export const ROI_SUMMARY_HELP_BASELINE_BODY = BASELINE_ROI_WHY_TWO;

export const ROI_SUMMARY_HELP_SIBLING_REPORTS = [
  {
    id: "executive-summary",
    title: "Executive summary",
    description: "Period preview of finalized reviews, governance activity, and sponsor exports.",
    actionLabel: "Open executive summary",
    href: SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  },
  {
    id: "pilot-outcomes",
    title: "Pilot outcomes",
    description: "Pilot-period summary of review activity, findings, and measurable outcomes.",
    actionLabel: "Open pilot outcomes",
    href: SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
  },
  {
    id: "architecture-scorecard",
    title: "Architecture scorecard",
    description: "Pilot operational KPIs and directional savings tiles for the current workspace window.",
    actionLabel: "Open architecture scorecard",
    href: ARCHITECTURE_SCORECARD_PATH,
  },
  {
    id: "baseline",
    title: "Baseline settings",
    description: "Review-cycle hours, people, and prep effort that form the ROI cost basis.",
    actionLabel: "Open baseline settings",
    href: BASELINE_SETTINGS_CANONICAL_PATH,
  },
] as const;

export const ROI_SUMMARY_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-the-report-shows", title: ROI_SUMMARY_HELP_REPORT_SECTION_TITLE },
  { level: 2, id: "how-to-read-roi-summary", title: "How to read ROI summary" },
  { level: 2, id: "data-needs-and-confidence", title: ROI_SUMMARY_HELP_DATA_NEEDS_SECTION_TITLE },
  { level: 2, id: "basis-of-estimate", title: ROI_SUMMARY_HELP_METHODOLOGY_SECTION_TITLE },
  { level: 2, id: "scorecard-vs-roi-summary", title: ROI_SUMMARY_HELP_SCORECARD_SECTION_TITLE },
  { level: 2, id: "baseline-vs-roi-summary", title: ROI_SUMMARY_HELP_BASELINE_SECTION_TITLE },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
