import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import { ALERT_ROUTING_TAB_PATH } from "@/lib/alert-routing-evidence-copy";
import { INTEGRATIONS_SLACK_PATH, INTEGRATIONS_TEAMS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import type { NotificationPreferenceStatusHintKey } from "./notification-preference-center-copy";
import { NOTIFICATION_PREFERENCE_STATUS_HINTS } from "./notification-preference-center-copy";

export type NotificationPreferenceChannel = {
  readonly id: string;
  readonly title: string;
  readonly whatItDoes: string;
  readonly href: string;
  readonly statusHintKey: NotificationPreferenceStatusHintKey;
  readonly ctaLabel: string;
};

/**
 * Product hub channels for "what will ping me?" - each CTA opens the existing configure surface.
 * There is no unified backend preference API; delivery is owned by each destination page.
 */
export const NOTIFICATION_PREFERENCE_CHANNELS: readonly NotificationPreferenceChannel[] = [
  {
    id: "digests",
    title: OPERATOR_NAV_LINK_LABELS.digests,
    whatItDoes:
      "Scheduled architecture summary emails for sponsors and operators who subscribe to digests.",
    href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
    statusHintKey: "configureInDigests",
    ctaLabel: "Configure digests",
  },
  {
    id: "alerts-inbox",
    title: OPERATOR_NAV_LINK_LABELS.alerts,
    whatItDoes: "In-product alerts when enabled rules detect findings that need attention.",
    href: "/governance/alerts",
    statusHintKey: "configureInAlertsInbox",
    ctaLabel: "Open alerts inbox",
  },
  {
    id: "alert-rules",
    title: OPERATOR_NAV_LINK_LABELS.alertRules,
    whatItDoes: "Rules, thresholds, and where qualifying alerts are delivered (routing / notifications).",
    href: ALERT_ROUTING_TAB_PATH,
    statusHintKey: "configureInAlertRules",
    ctaLabel: "Configure alert rules",
  },
  {
    id: "teams",
    title: OPERATOR_NAV_LINK_LABELS.microsoftTeams,
    whatItDoes: "Teams channel posts for selected review, approval, and workspace events.",
    href: INTEGRATIONS_TEAMS_PATH,
    statusHintKey: "configureInTeams",
    ctaLabel: "Configure Teams",
  },
  {
    id: "slack",
    title: OPERATOR_NAV_LINK_LABELS.slack,
    whatItDoes: "Slack channel posts for selected review, approval, and workspace events.",
    href: INTEGRATIONS_SLACK_PATH,
    statusHintKey: "configureInSlack",
    ctaLabel: "Configure Slack",
  },
] as const;

export function statusHintForNotificationChannel(
  channel: NotificationPreferenceChannel,
): string {
  return NOTIFICATION_PREFERENCE_STATUS_HINTS[channel.statusHintKey];
}
