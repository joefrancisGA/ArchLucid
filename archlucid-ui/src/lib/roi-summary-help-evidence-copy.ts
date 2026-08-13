import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor/sponsor-report-pilot-roi-measurement-help";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
} from "@/lib/sponsor-report-navigation";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";

export const ROI_SUMMARY_HELP_CANONICAL_PATH = "/help/roi-summary" as const;

export const ROI_SUMMARY_HELP_TOPIC_LABEL = "How to read ROI summary";

export const ROI_SUMMARY_HELP_CLAIM_DISCIPLINE =
  "This guide explains how to read portfolio ROI framing — it is not a signed review record or audited financial statement.";

export const ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ROI_SUMMARY_HELP_SOURCES_INTRO =
  "Use these follow-ups when reporting windows, cost basis, or methodology assumptions still need attention.";

export const ROI_SUMMARY_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Pilot ROI measurement methodology", href: SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF },
  { label: "Sponsor report help", href: "/help/sponsor-report" },
  { label: "Baseline settings", href: BASELINE_SETTINGS_CANONICAL_PATH },
  { label: "Baseline settings help", href: "/help/baseline-settings" },
  { label: SPONSOR_REPORT_PAGE_TITLE, href: SPONSOR_REPORT_PATH },
] as const;
