import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  BASELINE_SETTINGS_CANONICAL_PATH,
  BASELINE_SETTINGS_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_SOURCES_INTRO,
} from "@/lib/baseline-settings-evidence-copy";

export const BASELINE_SETTINGS_HELP_CANONICAL_PATH = "/help/baseline-settings" as const;

export const BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE =
  "This guide explains how baseline anchors feed ROI measurement — it is not a signed review record or audited financial statement.";

export const BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const BASELINE_SETTINGS_HELP_SOURCES_INTRO = BASELINE_SETTINGS_SOURCES_INTRO;

export const BASELINE_SETTINGS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Baseline settings", href: BASELINE_SETTINGS_CANONICAL_PATH },
  { label: "ROI summary", href: "/insights/roi-summary" },
  { label: "Architecture scorecard", href: "/insights/architecture-scorecard" },
  { label: "Pilot ROI measurement methodology", href: "/help/executive-summary#pilot-roi-measurement" },
  { label: "ROI summary help", href: "/help/roi-summary" },
  { label: "Assurance status", href: "/security-trust" },
] as const;

export const BASELINE_SETTINGS_HELP_OPERATOR_CLAIM = BASELINE_SETTINGS_CLAIM_DISCIPLINE;
