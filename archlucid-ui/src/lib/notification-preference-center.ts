import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import { ALERT_ROUTING_TAB_PATH } from "@/lib/alert-routing-evidence-copy";
import { INTEGRATIONS_SLACK_PATH, INTEGRATIONS_TEAMS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";

/** Canonical notification preference center (TB-2203) - hub over existing channel surfaces. */
export const NOTIFICATION_PREFERENCE_CENTER_PATH = SETTINGS_NOTIFICATIONS_PATH;

/** Stable keys for honest "configure on destination" hints - not live delivery status. */
export const NOTIFICATION_PREFERENCE_STATUS_HINT_KEYS = [
  "configureInDigests",
  "configureInAlertsInbox",
  "configureInAlertRules",
  "configureInTeams",
  "configureInSlack",
] as const;

export type NotificationPreferenceStatusHintKey = (typeof NOTIFICATION_PREFERENCE_STATUS_HINT_KEYS)[number];

export const NOTIFICATION_PREFERENCE_STATUS_HINTS: Readonly<
  Record<NotificationPreferenceStatusHintKey, string>
> = {
  configureInDigests: "Configure email digests and subscriptions on Digests.",
  configureInAlertsInbox: "Configure triage and resolution for governance alerts in the Alerts inbox.",
  configureInAlertRules: "Configure alert conditions and notification routing on Alert rules.",
  configureInTeams: "Configure which events post to Microsoft Teams on the Teams integration page.",
  configureInSlack: "Configure which events post to Slack on the Slack integration page.",
};

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
    whatItDoes: "In-product governance alerts when enabled rules detect findings that need attention.",
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
    whatItDoes: "Teams channel posts for selected review, governance, and workspace events.",
    href: INTEGRATIONS_TEAMS_PATH,
    statusHintKey: "configureInTeams",
    ctaLabel: "Configure Teams",
  },
  {
    id: "slack",
    title: OPERATOR_NAV_LINK_LABELS.slack,
    whatItDoes: "Slack channel posts for selected review, governance, and workspace events.",
    href: INTEGRATIONS_SLACK_PATH,
    statusHintKey: "configureInSlack",
    ctaLabel: "Configure Slack",
  },
] as const;

export const NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE = "Notifications";

export const NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE =
  "See which channels can ping you, then configure each one on its own page.";

export const NOTIFICATION_PREFERENCE_CENTER_HUB_DISCLAIMER =
  "This is a product hub over existing digests, alerts, Teams, and Slack settings - not a single saved preference profile.";

export function statusHintForNotificationChannel(
  channel: NotificationPreferenceChannel,
): string {
  return NOTIFICATION_PREFERENCE_STATUS_HINTS[channel.statusHintKey];
}

export function pathMatchesNotificationPreferenceCenter(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  return normalized === NOTIFICATION_PREFERENCE_CENTER_PATH;
}