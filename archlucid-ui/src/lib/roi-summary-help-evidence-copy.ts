import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ROI_SUMMARY_HELP_CANONICAL_PATH = "/help/roi-summary" as const;

export const ROI_SUMMARY_HELP_TOPIC_LABEL = "How to read ROI summary";

export const ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const ROI_SUMMARY_HELP_CLAIM_HEADING_ID = "help-roi-summary-claim-discipline-heading" as const;

export const ROI_SUMMARY_HELP_CLAIM_DISCIPLINE =
  "This guide explains how to read portfolio ROI framing — it is not a sealed review record or audited financial statement.";

export const ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ROI_SUMMARY_HELP_SOURCES_INTRO =
  "Use these follow-ups when reporting windows, cost basis, or methodology assumptions still need attention.";

/** Help follow-ups — methodology and sponsor report product links live elsewhere on this guide. */
export const ROI_SUMMARY_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Sponsor report help", href: inAppHelpHref("sponsor-report") },
  { label: "Baseline settings help", href: inAppHelpHref("baseline-settings") },
] as const;
