import {
  ALERT_RULES_FOLLOW_UPS_TITLE,
  ALERT_RULES_SOURCES,
  ALERT_RULES_SOURCES_INTRO,
} from "@/lib/alert-rules-evidence-copy";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ALERT_TEST_ALERTS_TAB_PATH = governanceAlertRulesTabHref("test-alerts");

export const ALERT_TEST_ALERTS_FOLLOW_UPS_TITLE = ALERT_RULES_FOLLOW_UPS_TITLE;

export const ALERT_TEST_ALERTS_SOURCES_INTRO = ALERT_RULES_SOURCES_INTRO;

const ALERT_TEST_ALERTS_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([ALERT_TEST_ALERTS_TAB_PATH]);

/** Test-alerts-tab orientation Sources — excludes self-href to `?tab=test-alerts` (GOT). */
export const ALERT_TEST_ALERTS_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = ALERT_RULES_SOURCES.filter(
  (source) => !ALERT_TEST_ALERTS_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
