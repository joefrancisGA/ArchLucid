import { BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE } from "@/lib/buyer/buyer-polish-copy";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { SPONSOR_SUMMARY_HELP_PATH } from "@/lib/sponsor/sponsor-report-help-route";

export const SPONSOR_REPORT_HELP_TOPIC_LABEL = BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE;

export const SPONSOR_SUMMARY_HELP_CANONICAL_PATH = SPONSOR_SUMMARY_HELP_PATH;

export const SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE =
  "This guide orients sponsors on pilot proof and ROI framing — not financial reporting or a full audit export. Open the live sponsor value report or dashboard when you need workspace numbers.";

export const SPONSOR_SUMMARY_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SPONSOR_SUMMARY_HELP_SOURCES_INTRO =
  "Use these follow-ups when sponsor proof needs live exports, portfolio KPIs, ROI methodology, or pilot orientation.";

/** Operator Sources — no self-href to `/help/sponsor-report`. */
export const SPONSOR_SUMMARY_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Open sponsor value report", href: SPONSOR_REPORT_PATH },
  { label: "Open sponsor dashboard", href: SPONSOR_DASHBOARD_HREF },
  { label: "ROI summary help", href: inAppHelpHref("roi-summary") },
  { label: "Architecture scorecard help", href: inAppHelpHref("architecture-scorecard") },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
] as const;
