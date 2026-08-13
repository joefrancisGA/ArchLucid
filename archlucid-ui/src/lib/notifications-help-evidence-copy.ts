import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { NOTIFICATION_PREFERENCE_CENTER_PATH } from "@/lib/notification-preference-center";

export const NOTIFICATIONS_HELP_CANONICAL_PATH = "/help/notifications" as const;

export const NOTIFICATIONS_HELP_CLAIM_DISCIPLINE =
  "This guide explains the notifications channel launcher — it is not a signed-review diligence Sources package and does not store a unified preference profile.";

export const NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const NOTIFICATIONS_HELP_SOURCES_INTRO =
  "Use these follow-ups when a channel card turns into digest subscriptions, alert routing, or chat integration setup.";

export const NOTIFICATIONS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Notifications", href: NOTIFICATION_PREFERENCE_CENTER_PATH },
  { label: "Alerts help", href: "/help/alerts" },
  { label: "Slack integration help", href: "/help/slack-integration" },
  { label: "Teams integration help", href: "/help/teams-integration" },
  { label: "Architecture digests", href: "/architecture/digests" },
] as const;
