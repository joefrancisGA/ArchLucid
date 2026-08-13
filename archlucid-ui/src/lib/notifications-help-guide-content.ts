import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE,
  NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
  NOTIFICATION_PREFERENCE_CENTER_PATH,
  NOTIFICATIONS_HELP_TOPIC_LABEL,
} from "@/lib/notification-preference-center";

export const NOTIFICATIONS_HELP_PAGE_TITLE = NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE;

export const NOTIFICATIONS_HELP_PAGE_SUBTITLE = NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE;

export const NOTIFICATIONS_HELP_OVERVIEW =
  "Notifications is a channel launcher — it shows delivery status for digests, in-product alerts, alert rules, Teams, and Slack. Each destination saves its own settings; this hub routes you to those pages.";

export const NOTIFICATIONS_HELP_PRIMARY_ACTION = {
  label: "Open notifications",
  href: NOTIFICATION_PREFERENCE_CENTER_PATH,
} as const;

export type NotificationsHelpTileItem = {
  readonly label: string;
  readonly detail: string;
};

export const NOTIFICATIONS_HELP_TILE_ITEMS: readonly NotificationsHelpTileItem[] = [
  {
    label: "Digests",
    detail: "Scheduled architecture summary emails for subscribers.",
  },
  {
    label: "Alerts inbox",
    detail: "In-product governance alerts when enabled rules detect findings.",
  },
  {
    label: "Alert rules",
    detail: "Conditions, thresholds, and routing destinations for governance notifications.",
  },
  {
    label: "Teams and Slack",
    detail: "Chat integrations post selected review and governance events to channels.",
  },
] as const;

export const NOTIFICATIONS_HELP_HOW_TO_READ_STEPS = [
  "Scan channel cards for delivery status and configure hints.",
  "Open the destination page when a channel needs setup or routing changes.",
  "Read alerts or integration help when notification questions turn into rule or webhook work.",
] as const;

export const NOTIFICATIONS_HELP_ALERTS_HREF = "/help/alerts";

export const NOTIFICATIONS_HELP_SLACK_HREF = "/help/slack-integration";

export const NOTIFICATIONS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-notifications-cover", title: "What notifications cover" },
  { level: 2, id: "how-notifications-work", title: NOTIFICATIONS_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
