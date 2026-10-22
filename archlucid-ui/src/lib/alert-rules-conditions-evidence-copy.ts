import {
  ALERT_RULES_CLAIM_DISCIPLINE,
  ALERT_RULES_FOLLOW_UPS_TITLE,
  ALERT_RULES_SOURCES,
  ALERT_RULES_SOURCES_INTRO,
} from "@/lib/alert-rules-evidence-copy";
import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ALERT_RULES_CONDITIONS_CLAIM_DISCIPLINE = ALERT_RULES_CLAIM_DISCIPLINE;

export const ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE = ALERT_RULES_FOLLOW_UPS_TITLE;

export const ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID =
  "alert-rules-conditions-orientation-bottom" as const;

export const ALERT_RULES_CONDITIONS_WORKSPACE_TEST_ID = "alert-rules-conditions-workspace" as const;

export const ALERT_RULES_CONDITIONS_SOURCES_INTRO = ALERT_RULES_SOURCES_INTRO;

export const ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "alert setup needs inbox triage, delivery channels, or product orientation",
);

const ALERT_RULES_CONDITIONS_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  GOVERNANCE_ALERT_RULES_PATH,
]);

/** Orientation-strip Sources — excludes in-tab Conditions workspace CTAs. */
export const ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  ALERT_RULES_SOURCES.filter(
    (source) => !ALERT_RULES_CONDITIONS_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
