import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

/** Buyer-facing section title for `#pilot-roi-measurement` (TB-1391). */
export const PILOT_ROI_MEASUREMENT_HELP_SECTION_TITLE = "Sponsor ROI methodology";

export const PILOT_ROI_MEASUREMENT_HELP_OVERVIEW =
  "How ArchLucid labels ROI evidence — baseline inputs, measured deltas, and conservative defaults — before you cite hours or dollars to sponsors.";

export const PILOT_ROI_MEASUREMENT_HELP_LIFECYCLE_LINE =
  "Request → finalize → review exports. Use the product surfaces below; engineering status names stay out of sponsor narratives.";

export const PILOT_ROI_MEASUREMENT_HELP_ANTI_OVERCLAIM =
  "A strong pilot proves workflow improvement and decision support — not enterprise-wide cost transformation or guaranteed savings.";

export const PILOT_ROI_MEASUREMENT_HELP_PRIMARY_ACTIONS = {
  setBaseline: {
    label: "Set review-cycle baseline",
    href: BASELINE_SETTINGS_CANONICAL_PATH,
  },
  openArchitectureScorecard: {
    label: "Open architecture scorecard",
    href: ARCHITECTURE_SCORECARD_PATH,
  },
  openRoiSummary: {
    label: "Open ROI summary",
    href: SPONSOR_REPORT_ROI_SUMMARY_PATH,
  },
} as const;

export type PilotRoiMeasurementBaselineLabel = {
  readonly label: string;
  readonly meaning: string;
};

export const PILOT_ROI_MEASUREMENT_HELP_BASELINE_LABELS: readonly PilotRoiMeasurementBaselineLabel[] = [
  {
    label: "buyer-provided",
    meaning: "Tenant supplied baseline at signup or via baseline settings.",
  },
  {
    label: "measured",
    meaning: "Computed from finalized architecture packages in the reporting window.",
  },
  {
    label: "defaulted",
    meaning: "Conservative model default — label as illustrative, not measured.",
  },
  {
    label: "demo-derived",
    meaning: "Contoso or demo tenant markers — walkthrough only, not external quotes.",
  },
  {
    label: "not-collected",
    meaning: "No baseline captured yet — avoid projected dollar savings claims in exports.",
  },
] as const;

export const PILOT_ROI_MEASUREMENT_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "pilot-roi-measurement", title: PILOT_ROI_MEASUREMENT_HELP_SECTION_TITLE, level: 2 },
  { id: "what-this-model-is-for", title: "What this model is for", level: 3 },
  { id: "what-to-measure-before-the-pilot", title: "What to measure before the pilot", level: 3 },
  { id: "what-to-measure-during-the-pilot", title: "What to measure during the pilot", level: 3 },
  { id: "what-a-successful-pilot-should-demonstrate", title: "What a successful pilot should demonstrate", level: 3 },
  { id: "what-not-to-over-claim", title: "What not to over-claim", level: 3 },
] as const;
