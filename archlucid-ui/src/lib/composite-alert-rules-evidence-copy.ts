import {
  ALERT_RULES_FOLLOW_UPS_TITLE,
  ALERT_RULES_SOURCES,
  ALERT_RULES_SOURCES_INTRO,
} from "@/lib/alert-rules-evidence-copy";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const COMPOSITE_ALERT_RULES_FOLLOW_UPS_TITLE = ALERT_RULES_FOLLOW_UPS_TITLE;

export const COMPOSITE_ALERT_RULES_SOURCES_INTRO = ALERT_RULES_SOURCES_INTRO;

const COMPOSITE_ALERT_RULES_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  governanceAlertRulesTabHref("advanced-rules"),
]);

/** Orientation-strip Sources — excludes self-href to the Advanced rules tab (GOA). */
export const COMPOSITE_ALERT_RULES_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  ALERT_RULES_SOURCES.filter(
    (source) => !COMPOSITE_ALERT_RULES_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
