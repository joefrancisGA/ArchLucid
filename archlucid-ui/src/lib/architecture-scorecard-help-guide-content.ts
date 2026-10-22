import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-scorecard-page-copy";
import { REVIEW_SCORECARD_PAGE_TITLE } from "@/lib/pilot-scorecard-present";
import {
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor/sponsor-report-pilot-roi-measurement-help";
import {
  DEFAULT_LOADED_HOURLY_USD,
  HOURS_PER_CRITICAL,
  HOURS_PER_HIGH,
  HOURS_PER_PRECOMMIT_BLOCK,
} from "@/lib/roi-assumptions";
import { roiSummaryMethodologyFormula } from "@/lib/roi-summary-sponsor-presentation";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";
import {
  SCORECARD_ROI_HEADING,
  SCORECARD_ROI_WHY_TWO,
} from "@/lib/vocabulary/scorecard-roi-vocabulary";

export { ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL };

export const ARCHITECTURE_SCORECARD_HELP_PAGE_TITLE = REVIEW_SCORECARD_PAGE_TITLE;

export const ARCHITECTURE_SCORECARD_HELP_PAGE_SUBTITLE =
  "Learn what each scorecard tile means and how directional savings are derived before you brief sponsors.";

export const ARCHITECTURE_SCORECARD_HELP_OVERVIEW =
  "The architecture scorecard shows workspace throughput tiles and a directional review-time savings model for pilot discussions. Savings figures are not financial reporting and not a Finalized review record.";

export const ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION = {
  label: "Open architecture scorecard",
  href: ARCHITECTURE_SCORECARD_PATH,
} as const;

export type ArchitectureScorecardHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const ARCHITECTURE_SCORECARD_HELP_TILE_ITEMS: readonly ArchitectureScorecardHelpTileItem[] = [
  {
    label: "Throughput tiles",
    detail: "Finalized reviews, approval activity, findings, and audit signals in the current scope.",
  },
  {
    label: "Directional ROI",
    detail: "Estimated review-time savings from severity-weighted findings when assumptions are sufficient.",
  },
  {
    label: "ROI assumptions",
    detail: "Tune assumptions on the scorecard when you have Execute authority, or use baseline settings.",
  },
  {
    label: "Methodology drill-down",
    detail: "Open pilot ROI measurement methodology when sponsors ask how savings are calculated.",
  },
] as const;

export const ARCHITECTURE_SCORECARD_HELP_HOW_TO_READ_STEPS = [
  "Finalize architecture reviews so throughput tiles populate for the current workspace scope.",
  "Review directional ROI and assumption panels before citing savings in sponsor conversations.",
  "Open ROI summary or baseline settings when portfolio framing or cost basis needs adjustment.",
] as const;

export const ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_SECTION_TITLE = "Basis of estimate";

export const ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_BODY =
  "Directional savings combine severity-weighted findings and approval-check blocks with review-cycle and cost assumptions from baseline settings.";

export const ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_FORMULA = roiSummaryMethodologyFormula();

export const ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_HREF = SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF;

export const ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_LABEL = "Review pilot ROI measurement methodology";

export const ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_TITLE = "Illustrative worked example";

export const ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_LINES = [
  `1 Critical finding → ${HOURS_PER_CRITICAL} h`,
  `2 High findings → ${HOURS_PER_HIGH * 2} h`,
  `1 approval-check block → ${HOURS_PER_PRECOMMIT_BLOCK} h`,
  `Total: ${HOURS_PER_CRITICAL + HOURS_PER_HIGH * 2 + HOURS_PER_PRECOMMIT_BLOCK} h estimated review-time surfaced`,
  `At $${DEFAULT_LOADED_HOURLY_USD}/h loaded cost (baseline settings) → ~$${(HOURS_PER_CRITICAL + HOURS_PER_HIGH * 2 + HOURS_PER_PRECOMMIT_BLOCK) * DEFAULT_LOADED_HOURLY_USD} directional savings`,
] as const;

export const ARCHITECTURE_SCORECARD_HELP_SCORECARD_ROI_SECTION_TITLE = SCORECARD_ROI_HEADING;

export const ARCHITECTURE_SCORECARD_HELP_SCORECARD_ROI_BODY = SCORECARD_ROI_WHY_TWO;

export const ARCHITECTURE_SCORECARD_HELP_SIBLING_REPORTS = [
  {
    id: "roi-summary",
    title: "ROI summary",
    description: "Portfolio KPI view for review-cycle reduction and export-ready artifacts.",
    actionLabel: "Open ROI summary",
    href: SPONSOR_REPORT_ROI_SUMMARY_PATH,
  },
  {
    id: "sponsor-report",
    title: SPONSOR_REPORT_PAGE_TITLE,
    description: "Reporting-period summary of review activity and measurable outcomes.",
    actionLabel: "Open sponsor report",
    href: SPONSOR_REPORT_PATH,
  },
  {
    id: "baseline",
    title: "Baseline settings",
    description: "Review-cycle hours and loaded hourly cost that form the ROI cost basis.",
    actionLabel: "Open baseline settings",
    href: BASELINE_SETTINGS_CANONICAL_PATH,
  },
] as const;


export const ARCHITECTURE_SCORECARD_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-the-scorecard-shows", title: "What the scorecard shows" },
  { level: 2, id: "how-to-read-architecture-scorecard", title: ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL },
  { level: 2, id: "basis-of-estimate", title: ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_SECTION_TITLE },
  { level: 2, id: "scorecard-vs-roi-summary", title: ARCHITECTURE_SCORECARD_HELP_SCORECARD_ROI_SECTION_TITLE },
  { level: 2, id: ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID, title: ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE_HEADING },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
