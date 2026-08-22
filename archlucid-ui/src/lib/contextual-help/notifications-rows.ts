/** Notifications preference center and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  NOTIFICATION_PREFERENCE_CENTER_PATH,
  NOTIFICATIONS_HELP_TOPIC_LABEL,
} from "@/lib/notification-preference-center";
import { NOTIFICATIONS_HELP_CANONICAL_PATH } from "@/lib/notifications-help-evidence-copy";

const NOTIFICATIONS_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Notifications — channel launcher that shows delivery status for digests, in-product alerts, alert rules, Teams, and Slack.",
  whatToDoNext:
    "Review each channel card, then open the destination page to change subscriptions, rules, or webhook connections.",
  whyEmpty:
    "Status tags load from each channel's API; when a destination cannot be read here, configure it on that page.",
  whereToConfigurePrerequisite:
    "Digests, alert rules, Teams, and Slack each save settings on their own pages — this hub does not store a unified preference profile.",
  taskSteps: [
    "Scan each channel card for delivery or configuration status.",
    "Open the destination page when a channel needs subscriptions or routing.",
    "Follow alerts or integration help when a connector is not configured yet.",
  ],
} as const;

export const NOTIFICATIONS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: NOTIFICATION_PREFERENCE_CENTER_PATH,
    entry: NOTIFICATIONS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: NOTIFICATIONS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Notifications — ${NOTIFICATIONS_HELP_TOPIC_LABEL.toLowerCase()} and why each channel configures on its own page.`,
      whatToDoNext:
        "Open notifications to scan channel status, then follow alerts or integration help when routing needs setup.",
      whyEmpty: "This guide is always available; channel cards reflect each destination's reported status.",
      whereToConfigurePrerequisite:
        "Alerts help explains governance notification rules and routing destinations.",
      whatToDoNextAction: {
        label: "Open notifications",
        href: NOTIFICATION_PREFERENCE_CENTER_PATH,
      },
      whereToConfigureAction: {
        label: "Read alerts help",
        href: "/help/alerts",
      },
    },
  },
];
