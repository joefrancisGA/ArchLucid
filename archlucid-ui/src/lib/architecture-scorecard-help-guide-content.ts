import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-scorecard-page-copy";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/executive/executive-summary-pilot-roi-measurement-help";
import {
  REVIEW_SCORECARD_PAGE_SUBTITLE,
  REVIEW_SCORECARD_PAGE_TITLE,
} from "@/lib/pilot-scorecard-present";
import {
  SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";
import {
  SCORECARD_ROI_HEADING,
  SCORECARD_ROI_WHY_TWO,
} from "@/lib/vocabulary/scorecard-roi-vocabulary";

export { ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL };

export const ARCHITECTURE_SCORECARD_HELP_PAGE_TITLE = REVIEW_SCORECARD_PAGE_TITLE;

export const ARCHITECTURE_SCORECARD_HELP_PAGE_SUBTITLE = REVIEW_SCORECARD_PAGE_SUBTITLE;

export const ARCHITECTURE_SCORECARD_HELP_OVERVIEW =
  "The architecture scorecard shows workspace throughput tiles and a directional review-time savings model for pilot discussions. Savings figures are not financial reporting and not a signed review record.";

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
    detail: "Finalized reviews, governance activity, findings, and audit signals in the current scope.",
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

export const ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_HREF = EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF;

export const ARCHITECTURE_SCORECARD_HELP_METHODOLOGY_LABEL = "Review pilot ROI measurement methodology";

export const ARCHITECTURE_SCORECARD_HELP_SCORECARD_ROI_SECTION_TITLE = SCORECARD_ROI_HEADING;

export const ARCHITECTURE_SCORECARD_HELP_SCORECARD_ROI_BODY = SCORECARD_ROI_WHY_TWO;

export const ARCHITECTURE_SCORECARD_HELP_SIBLING_REPORTS = [
  {
    id: "roi-summary",
    title: "ROI summary",
    description: "Portfolio KPI view for review-cycle reduction and governance-ready artifacts.",
    actionLabel: "Open ROI summary",
    href: SPONSOR_REPORT_ROI_SUMMARY_PATH,
  },
  {
    id: "pilot-outcomes",
    title: "Pilot outcomes",
    description: "Pilot-period summary of review activity and measurable outcomes.",
    actionLabel: "Open pilot outcomes",
    href: SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
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
  { level: 2, id: "scorecard-vs-roi-summary", title: ARCHITECTURE_SCORECARD_HELP_SCORECARD_ROI_SECTION_TITLE },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
