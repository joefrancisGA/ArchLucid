import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  HOURS_PER_CRITICAL,
  HOURS_PER_HIGH,
  HOURS_PER_MEDIUM,
  HOURS_PER_PRECOMMIT_BLOCK,
  ROI_HOURS_COEFFICIENTS_PROVENANCE,
} from "@/lib/roi-assumptions";
import {
  ROI_SUMMARY_PAGE_SUBTITLE,
  roiSummaryBasisOfEstimateCopy,
  roiSummaryDirectionalDisclaimer,
  roiSummaryMethodologyFormula,
} from "@/lib/roi-summary-sponsor-presentation";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import {
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING,
  ROI_SUMMARY_HELP_CLAIM_HEADING_ID,
} from "@/lib/roi-summary-help-evidence-copy";

export const ROI_SUMMARY_HELP_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.roiReport;

export const ROI_SUMMARY_HELP_BREADCRUMB_TOPIC_TITLE = "ROI summary";

export const ROI_SUMMARY_HELP_PAGE_SUBTITLE = ROI_SUMMARY_PAGE_SUBTITLE;

export const ROI_SUMMARY_HELP_OVERVIEW =
  "ROI summary is the portfolio KPI view for review-cycle reduction, estimated effort saved, and export-ready artifacts across a reporting window. Use it for sponsor value discussions — not financial reporting.";

export const ROI_SUMMARY_HELP_START_HERE_CARD_TITLE = "Start here";

export const ROI_SUMMARY_HELP_START_HERE_HELPER =
  "Pick a reporting window and review confidence labels on the ROI summary page before citing hours or dollars to sponsors.";

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
    detail: "A recent window for directional savings from finalized findings and approval-check blocks.",
  },
  {
    label: "Since pilot start",
    detail: "Pilot-to-date framing when you need cumulative value across the full pilot window.",
  },
  {
    label: "Hours saved",
    detail: "Estimated review and rework time avoided from severity-weighted findings and approval-check blocks.",
  },
  {
    label: "USD estimate",
    detail: "Directional dollar framing when loaded hourly cost and surfaced hours are sufficient.",
  },
] as const;

export const ROI_SUMMARY_HELP_HOW_TO_READ_STEPS = [
  "Pick the reporting window — rolling 30 days for recent activity or since pilot start for cumulative framing.",
  "Review confidence and data needs on the page before citing hours or dollars to sponsors.",
  "Enter loaded hourly cost on the ROI summary page when you need a meaningful dollar estimate.",
] as const;

export const ROI_SUMMARY_HELP_DATA_NEEDS_SECTION_TITLE = "Data needs and confidence";

export const ROI_SUMMARY_HELP_DATA_NEEDS_ITEMS = [
  "At least one finalized review in the selected period.",
  "Findings with severity counts toward the hours model.",
  "Approval-check blocks or review-time baseline inputs sharpen the estimate.",
  "Loaded hourly cost unlocks a meaningful dollar estimate.",
  "Loaded hourly cost is saved in this browser only — it is not shared across people or devices.",
] as const;

export const ROI_SUMMARY_HELP_METHODOLOGY_SECTION_TITLE = "Basis of estimate";

export const ROI_SUMMARY_HELP_METHODOLOGY_FORMULA = roiSummaryMethodologyFormula();

export const ROI_SUMMARY_HELP_METHODOLOGY_BODY =
  `${roiSummaryBasisOfEstimateCopy()} ${ROI_HOURS_COEFFICIENTS_PROVENANCE}`;

export const ROI_SUMMARY_HELP_METHODOLOGY_UNITS =
  `Coefficients are hours per finding by severity and hours per approval-check block in a finalized review: ${HOURS_PER_CRITICAL} hours per Critical, ${HOURS_PER_HIGH} per High, ${HOURS_PER_MEDIUM} per Medium, and ${HOURS_PER_PRECOMMIT_BLOCK} per approval-check block.`;

export type RoiSummaryHelpMethodologyCoefficientRow = {
  readonly id: string;
  readonly label: string;
  readonly hours: number;
  readonly severity?: "critical" | "high" | "medium";
};

/** Auditable hours-per-unit rows — values must stay aligned with {@link roiSummaryMethodologyFormula}. */
export const ROI_SUMMARY_HELP_METHODOLOGY_COEFFICIENT_ROWS: readonly RoiSummaryHelpMethodologyCoefficientRow[] =
  [
    { id: "critical", label: "Critical finding", severity: "critical", hours: HOURS_PER_CRITICAL },
    { id: "high", label: "High finding", severity: "high", hours: HOURS_PER_HIGH },
    { id: "medium", label: "Medium finding", severity: "medium", hours: HOURS_PER_MEDIUM },
    { id: "governance-block", label: "Approval-check block", hours: HOURS_PER_PRECOMMIT_BLOCK },
  ] as const;

export const ROI_SUMMARY_HELP_DIRECTIONAL_DISCLAIMER = roiSummaryDirectionalDisclaimer();

export const ROI_SUMMARY_HELP_NEARBY_SURFACES_SECTION_TITLE =
  "How ROI summary relates to nearby surfaces" as const;

export const ROI_SUMMARY_HELP_SIBLING_REPORTS = [
  {
    id: "sponsor-report",
    title: SPONSOR_REPORT_PAGE_TITLE,
    description: "Period summary of review activity, findings, approval decisions, and measurable outcomes, plus sponsor exports.",
    actionLabel: "Open sponsor report",
    href: SPONSOR_REPORT_PATH,
  },
] as const;

export const ROI_SUMMARY_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-the-report-shows", title: ROI_SUMMARY_HELP_REPORT_SECTION_TITLE },
  { level: 2, id: "how-to-read-roi-summary", title: "How to read ROI summary" },
  { level: 2, id: "data-needs-and-confidence", title: ROI_SUMMARY_HELP_DATA_NEEDS_SECTION_TITLE },
  { level: 2, id: "basis-of-estimate", title: ROI_SUMMARY_HELP_METHODOLOGY_SECTION_TITLE },
  {
    level: 2,
    id: "how-roi-summary-relates-to-nearby-surfaces",
    title: ROI_SUMMARY_HELP_NEARBY_SURFACES_SECTION_TITLE,
  },
  { level: 2, id: "sibling-sponsor-reports", title: "Related sponsor reports" },
  {
    level: 2,
    id: ROI_SUMMARY_HELP_CLAIM_HEADING_ID,
    title: ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
