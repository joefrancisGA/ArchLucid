import {
  ALERT_RULES_FOLLOW_UPS_TITLE,
  ALERT_RULES_SOURCES,
  ALERT_RULES_SOURCES_INTRO,
} from "@/lib/alert-rules-evidence-copy";
import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE = ALERT_RULES_FOLLOW_UPS_TITLE;

export const ALERT_RULES_CONDITIONS_SOURCES_INTRO = ALERT_RULES_SOURCES_INTRO;

const ALERT_RULES_CONDITIONS_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  GOVERNANCE_ALERT_RULES_PATH,
]);

/** Orientation-strip Sources — excludes in-tab Conditions workspace CTAs. */
export const ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  ALERT_RULES_SOURCES.filter(
    (source) => !ALERT_RULES_CONDITIONS_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
