import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_AUDIT_PATH,
} from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { NOTIFICATION_PREFERENCE_CENTER_PATH } from "@/lib/notification-preference-center";

export const NOTIFICATIONS_HELP_CANONICAL_PATH = "/help/notifications" as const;

export const NOTIFICATIONS_HELP_TOPIC_LABEL = "How notifications work" as const;

export const NOTIFICATIONS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const NOTIFICATIONS_HELP_CLAIM_DISCIPLINE =
  "This guide explains the notifications channel launcher. Each channel saves its own settings on its destination page — this help topic does not store a unified preference profile or show live delivery health.";

export const NOTIFICATIONS_HELP_CLAIM_HEADING_ID = "help-notifications-claim-discipline-heading" as const;

export const NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const NOTIFICATIONS_HELP_SOURCES_INTRO =
  "Use these follow-ups when a channel card turns into digest subscriptions, alert routing, chat integration setup, or audit context.";

export const NOTIFICATIONS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Notifications", href: NOTIFICATION_PREFERENCE_CENTER_PATH },
  { label: "Alerts inbox", href: GOVERNANCE_ALERTS_PATH },
  { label: "Alert rules", href: GOVERNANCE_ALERT_RULES_PATH },
  { label: "Architecture digests", href: DIGESTS_SUBSCRIPTIONS_TAB_PATH },
  { label: "Alerts help", href: "/help/alerts" },
  { label: "Slack integration help", href: "/help/slack-integration" },
  { label: "Teams integration help", href: "/help/teams-integration" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
