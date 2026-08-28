import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";
import {
  DIGESTS_NOTIFICATIONS_HEADING,
  DIGESTS_NOTIFICATIONS_WHY_TWO,
  DIGESTS_NOTIFICATIONS_DIGESTS_LINK,
  DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK,
} from "@/lib/vocabulary/digests-notifications-vocabulary";
import {
  PREFERENCES_NOTIFICATIONS_HEADING,
  PREFERENCES_NOTIFICATIONS_WHY_TWO,
  PREFERENCES_NOTIFICATIONS_PREFERENCES_LINK,
  PREFERENCES_NOTIFICATIONS_NOTIFICATIONS_LINK,
} from "@/lib/vocabulary/preferences-notifications-vocabulary";
import {
  TEAMS_SLACK_NOTIFICATION_HEADING,
  TEAMS_SLACK_NOTIFICATION_WHY_TWO,
  TEAMS_SLACK_NOTIFICATION_TEAMS_LINK,
  TEAMS_SLACK_NOTIFICATION_SLACK_LINK,
} from "@/lib/vocabulary/teams-slack-notification-vocabulary";

import type { NotificationPreferenceChannel } from "./notification-preference-center-channels";

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
  configureInAlertsInbox: "Configure triage and resolution for alerts in the Alerts inbox.",
  configureInAlertRules: "Configure alert conditions and notification routing on Alert rules.",
  configureInTeams: "Configure which events post to Microsoft Teams on the Teams integration page.",
  configureInSlack: "Configure which events post to Slack on the Slack integration page.",
};

export const NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE = "Notifications";

export const NOTIFICATIONS_HELP_TOPIC_LABEL = "How notifications work";

export const NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE =
  "See which channels can ping you, then configure each one on its own page.";

export const BUYER_NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE =
  "See which channels can notify you, then configure each on its own page." as const;

export function notificationPreferenceCenterPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? BUYER_NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE
    : NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE;
}

/** One-line orientation between subtitle and the channel grid. */
export const NOTIFICATION_PREFERENCE_CENTER_ORIENTATION_LINE =
  "Each channel saves its own settings — status below reflects what ArchLucid can report from those destinations.";

/** @deprecated Use {@link NOTIFICATION_PREFERENCE_CENTER_ORIENTATION_LINE} and relations disclosure. */
export const NOTIFICATION_PREFERENCE_CENTER_HUB_DISCLAIMER =
  "Notification settings are saved on each channel page — this hub routes you to those destinations.";

export const NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY =
  "How this page relates to Digests, Preferences, Teams and Slack";

export type NotificationPreferenceCenterRelationLink = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type NotificationPreferenceCenterRelationsSection = {
  readonly id: string;
  readonly heading: string;
  readonly body: string;
  readonly links: readonly NotificationPreferenceCenterRelationLink[];
};

export const NOTIFICATION_PREFERENCE_CENTER_RELATIONS_SECTIONS: readonly NotificationPreferenceCenterRelationsSection[] = [
  {
    id: "preferences-notifications",
    heading: PREFERENCES_NOTIFICATIONS_HEADING,
    body: PREFERENCES_NOTIFICATIONS_WHY_TWO,
    links: [PREFERENCES_NOTIFICATIONS_PREFERENCES_LINK, PREFERENCES_NOTIFICATIONS_NOTIFICATIONS_LINK],
  },
  {
    id: "digests-notifications",
    heading: DIGESTS_NOTIFICATIONS_HEADING,
    body: DIGESTS_NOTIFICATIONS_WHY_TWO,
    links: [DIGESTS_NOTIFICATIONS_DIGESTS_LINK, DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK],
  },
  {
    id: "teams-slack",
    heading: TEAMS_SLACK_NOTIFICATION_HEADING,
    body: TEAMS_SLACK_NOTIFICATION_WHY_TWO,
    links: [TEAMS_SLACK_NOTIFICATION_TEAMS_LINK, TEAMS_SLACK_NOTIFICATION_SLACK_LINK],
  },
] as const;

export function pathMatchesNotificationPreferenceCenter(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  return normalized === NOTIFICATION_PREFERENCE_CENTER_PATH;
}
