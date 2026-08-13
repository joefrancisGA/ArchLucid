import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/executive/executive-summary-pilot-roi-measurement-help";
import {
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
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
  { label: "Pilot ROI measurement methodology", href: EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF },
  { label: "Executive summary help", href: "/help/executive-summary" },
  { label: "Pilot outcomes", href: SPONSOR_REPORT_PILOT_OUTCOMES_PATH },
  { label: "Baseline settings", href: BASELINE_SETTINGS_CANONICAL_PATH },
  { label: "Baseline settings help", href: "/help/baseline-settings" },
  { label: "Executive summary", href: SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH },
] as const;
