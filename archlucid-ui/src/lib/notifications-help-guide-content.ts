import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  NOTIFICATION_PREFERENCE_CENTER_PATH,
  NOTIFICATION_PREFERENCE_CHANNELS,
} from "@/lib/notification-preference-center";
import {
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE_HEADING,
  NOTIFICATIONS_HELP_CLAIM_HEADING_ID,
  NOTIFICATIONS_HELP_TOPIC_LABEL,
} from "@/lib/notifications-help-evidence-copy";

export const NOTIFICATIONS_HELP_BREADCRUMB_TOPIC_TITLE = "Notifications";

export const NOTIFICATIONS_HELP_PAGE_TITLE = "How notifications reach you";

export const NOTIFICATIONS_HELP_PAGE_SUBTITLE =
  "Learn which channels can notify you, where each destination is configured, and when to open alerts or integration help.";

export const NOTIFICATIONS_HELP_OVERVIEW =
  "Notifications is a channel launcher — it lists digests, in-product alerts, alert rules, Teams, and Slack and routes you to where each channel is configured. Each destination saves its own settings; this hub does not store a unified preference profile.";

export const NOTIFICATIONS_HELP_START_HERE_CARD_TITLE = "Start here";

export const NOTIFICATIONS_HELP_ROLE_PRECONDITION_TAG = "Read";

export const NOTIFICATIONS_HELP_ROLE_PRECONDITION =
  "Browse the notifications hub with workspace read access; changing subscriptions, rules, or integrations requires access on each destination page.";

export const NOTIFICATIONS_HELP_START_HERE_HELPER =
  "Digests, alert rules, Teams, and Slack each save settings on their own pages — the notifications hub routes you to those destinations.";

export const NOTIFICATIONS_HELP_PRIMARY_ACTION = {
  label: "Open notifications",
  href: NOTIFICATION_PREFERENCE_CENTER_PATH,
} as const;

export type NotificationsHelpTileItem = {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
};

/** 1:1 with {@link NOTIFICATION_PREFERENCE_CHANNELS} — drift guard enforces parity. */
export const NOTIFICATIONS_HELP_TILE_ITEMS: readonly NotificationsHelpTileItem[] =
  NOTIFICATION_PREFERENCE_CHANNELS.map((channel) => ({
    label: channel.title,
    detail: channel.whatItDoes,
    href: channel.href,
  }));

export const NOTIFICATIONS_HELP_HOW_TO_READ_STEPS = [
  "Scan channel cards for which destinations exist and where each one configures.",
  "Open the destination page when a channel needs setup or routing changes.",
  "Read alerts or integration help when notification questions turn into rule or webhook work.",
] as const;

export type NotificationsHelpWorkedExample = {
  readonly scenario: string;
  readonly detail: string;
};

export const NOTIFICATIONS_HELP_WORKED_EXAMPLES_TITLE = "Worked examples";

export const NOTIFICATIONS_HELP_WORKED_EXAMPLES: readonly NotificationsHelpWorkedExample[] = [
  {
    scenario: "Digest email",
    detail:
      "A weekly architecture summary email sends to subscribers who enabled digests on the Digests subscriptions tab.",
  },
  {
    scenario: "Teams channel post",
    detail:
      "A governance approval event posts to a configured Microsoft Teams channel when Teams integration triggers are enabled.",
  },
  {
    scenario: "Alert-rule notification",
    detail:
      "An enabled alert rule routes a governance finding notification to the alerts inbox and any configured destinations.",
  },
  {
    scenario: "Audit trail entry",
    detail:
      "Subscription changes, integration updates, and alert routing edits append governed audit trail entries — open Audit when you need accountability context.",
  },
] as const;

export const NOTIFICATIONS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-notifications-cover", title: "What notifications cover" },
  { level: 2, id: "how-notifications-work", title: NOTIFICATIONS_HELP_TOPIC_LABEL },
  { level: 2, id: "notification-worked-examples", title: NOTIFICATIONS_HELP_WORKED_EXAMPLES_TITLE },
  {
    level: 2,
    id: NOTIFICATIONS_HELP_CLAIM_HEADING_ID,
    title: NOTIFICATIONS_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: overview stays positive-only; claim band owns configuration limits once. */
export const NOTIFICATIONS_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["delivery status", "Sources package", "sources package"],
  stepsMustNotContain: ["delivery status"],
} as const;
