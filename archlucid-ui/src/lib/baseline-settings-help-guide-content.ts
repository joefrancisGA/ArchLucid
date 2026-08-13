import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { BASELINE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/baseline-settings-evidence-copy";
import {
  BASELINE_SETTINGS_CONSERVATIVE_DEFAULTS_NOTE,
  BASELINE_SETTINGS_PAGE_SUBTITLE,
  BASELINE_SETTINGS_PAGE_TITLE,
  BASELINE_SETTINGS_USED_IN_SURFACES,
} from "@/lib/baseline-settings-present";
import {
  BASELINE_ROI_HEADING,
  BASELINE_ROI_WHY_TWO,
} from "@/lib/vocabulary/baseline-roi-vocabulary";

export const BASELINE_SETTINGS_HELP_PAGE_TITLE = BASELINE_SETTINGS_PAGE_TITLE;

export const BASELINE_SETTINGS_HELP_PAGE_SUBTITLE = BASELINE_SETTINGS_PAGE_SUBTITLE;

export const BASELINE_SETTINGS_HELP_OVERVIEW =
  "Baseline settings capture workspace ROI measurement anchors — review-cycle hours, prep time, and people per review. Reports use these inputs (or conservative defaults) when estimating time saved — they are not financial reporting by themselves.";

export const BASELINE_SETTINGS_HELP_PRIMARY_ACTION = {
  label: "Open baseline settings",
  href: "/administration/baseline",
} as const;

export type BaselineSettingsHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const BASELINE_SETTINGS_HELP_ANCHOR_ITEMS: readonly BaselineSettingsHelpItem[] = [
  {
    label: "Review-cycle hours",
    detail: "Median hours spent per architecture review before ArchLucid — used as the cost basis for savings estimates.",
  },
  {
    label: "Manual prep hours",
    detail: "Typical prep effort per review when you want workspace-specific modeling instead of defaults.",
  },
  {
    label: "People per review",
    detail: "How many reviewers or stakeholders participate when you translate hours into sponsor-facing savings.",
  },
  {
    label: "Conservative defaults",
    detail: BASELINE_SETTINGS_CONSERVATIVE_DEFAULTS_NOTE,
  },
] as const;

export const BASELINE_SETTINGS_HELP_HOW_TO_READ_STEPS = [
  "Enter anchors that match your pilot charter or procurement discussion — blank fields keep conservative modeled defaults.",
  "Save when Execute authority is available; saved baselines stay until you update the values.",
  "Open ROI summary or architecture scorecard when you need portfolio framing beyond measurement inputs.",
] as const;

export const BASELINE_SETTINGS_HELP_USED_IN_SURFACES = BASELINE_SETTINGS_USED_IN_SURFACES;

export const BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_TITLE = BASELINE_ROI_HEADING;

export const BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_BODY = BASELINE_ROI_WHY_TWO;

export const BASELINE_SETTINGS_HELP_METHODOLOGY_HREF = "/help/sponsor-report#pilot-roi-measurement";

export const BASELINE_SETTINGS_HELP_METHODOLOGY_LABEL = "Read pilot ROI measurement methodology";

export const BASELINE_SETTINGS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-baseline-settings-captures", title: "What baseline settings capture" },
  { level: 2, id: "how-baseline-settings-work", title: BASELINE_SETTINGS_HELP_TOPIC_LABEL },
  { level: 2, id: "baseline-vs-roi-summary", title: BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_TITLE },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
