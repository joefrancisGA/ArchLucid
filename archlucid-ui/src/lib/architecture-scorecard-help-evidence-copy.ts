import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/executive/executive-summary-pilot-roi-measurement-help";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";

export const ARCHITECTURE_SCORECARD_HELP_CANONICAL_PATH = "/help/architecture-scorecard" as const;

export const ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE =
  "This guide explains how to read architecture scorecard tiles — savings figures are directional for pilot discussions, not financial reporting or a signed review record.";

export const ARCHITECTURE_SCORECARD_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO =
  "Open ROI summary, reviews, or methodology help before briefing sponsors from scorecard tiles.";

export const ARCHITECTURE_SCORECARD_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "ROI summary", href: "/insights/roi-summary" },
  { label: "Pilot ROI measurement methodology", href: EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Baseline settings", href: BASELINE_SETTINGS_CANONICAL_PATH },
  { label: "Architecture scorecard", href: ARCHITECTURE_SCORECARD_PATH },
  { label: "ROI summary help", href: inAppHelpHref("roi-summary") },
] as const;
