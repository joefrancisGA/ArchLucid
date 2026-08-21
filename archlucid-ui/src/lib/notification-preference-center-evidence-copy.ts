import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_ALERT_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { INTEGRATIONS_SLACK_PATH, INTEGRATIONS_TEAMS_PATH } from "@/lib/integrations-nav-paths";
import { NOTIFICATION_PREFERENCE_CENTER_PATH } from "@/lib/notification-preference-center";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CANONICAL_PATH = NOTIFICATION_PREFERENCE_CENTER_PATH;

export const NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CLAIM_DISCIPLINE_HEADING =
  "What this page does not cover";

export const NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CLAIM_HEADING_ID =
  "notification-preference-center-claim-discipline-heading" as const;

export const NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CLAIM_DISCIPLINE =
  "This notifications hub routes you to channel-specific configuration pages — it does not store a unified preference profile or prove live delivery health for procurement diligence.";

export const NOTIFICATION_PREFERENCE_CENTER_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const NOTIFICATION_PREFERENCE_CENTER_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when a channel card turns into digest subscriptions, alert routing, chat integration setup, or official assurance materials.";

/** Operator Sources — no self-href to the notifications hub. */
export const NOTIFICATION_PREFERENCE_CENTER_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "How notifications work", href: inAppHelpHref("notifications") },
  { label: "Alerts inbox", href: GOVERNANCE_ALERTS_PATH },
  { label: "Alert rules", href: GOVERNANCE_ALERT_RULES_PATH },
  { label: "Architecture digests", href: DIGESTS_SUBSCRIPTIONS_TAB_PATH },
  { label: "Teams integration", href: INTEGRATIONS_TEAMS_PATH },
  { label: "Slack integration", href: INTEGRATIONS_SLACK_PATH },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
