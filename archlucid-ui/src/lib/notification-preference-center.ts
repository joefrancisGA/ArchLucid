import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import { ALERT_ROUTING_TAB_PATH } from "@/lib/alert-routing-evidence-copy";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { INTEGRATIONS_SLACK_PATH, INTEGRATIONS_TEAMS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";
import {
  resolveTeamsIntegrationConnectionStatus,
  teamsIntegrationConnectionStatusLabel,
  teamsIntegrationConnectionStatusTagKind,
} from "@/lib/teams-integration-page-copy";
import {
  slackIntegrationConfigurationStatusLabel,
  slackIntegrationConfigurationStatusTagKind,
} from "@/lib/slack-integration-page-copy";
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
import type { DigestSubscription } from "@/types/digest-subscriptions";

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

export type NotificationChannelDeliveryLoadState = "loading" | "ready" | "error";

export type NotificationChannelDeliveryStatus = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
  readonly provenanceFact: string | null;
  readonly configureHint: string;
};

export type NotificationChannelDeliveryStatusInput = {
  readonly digestSubscriptions: readonly DigestSubscription[];
  readonly digestLoadState: NotificationChannelDeliveryLoadState;
  readonly alertsLoadState: NotificationChannelDeliveryLoadState;
  readonly enabledRulesCount: number;
  readonly enabledRoutingCount: number;
  readonly openAlertsCount: number;
  readonly teamsLoadState: NotificationChannelDeliveryLoadState;
  readonly teamsIsConfigured: boolean;
  readonly teamsEnabledTriggerCount: number;
  readonly slackLoadState: NotificationChannelDeliveryLoadState;
  readonly activeSlackDestinationCount: number;
  readonly totalSlackDestinationCount: number;
};

function configureHintForChannel(channelId: string): string {
  const channel = NOTIFICATION_PREFERENCE_CHANNELS.find((row) => row.id === channelId);

  if (channel === undefined) {
    return "Configure on the destination page.";
  }

  return NOTIFICATION_PREFERENCE_STATUS_HINTS[channel.statusHintKey];
}

function notReportedStatus(channelId: string): NotificationChannelDeliveryStatus {
  return {
    kind: "blocked",
    label: "Not reported here",
    provenanceFact: null,
    configureHint: configureHintForChannel(channelId),
  };
}

function resolveDigestsDeliveryStatus(
  input: NotificationChannelDeliveryStatusInput,
): NotificationChannelDeliveryStatus {
  if (input.digestLoadState === "loading") {
    return {
      kind: "neutral",
      label: "Loading",
      provenanceFact: null,
      configureHint: configureHintForChannel("digests"),
    };
  }

  if (input.digestLoadState === "error") {
    return notReportedStatus("digests");
  }

  const enabledCount = input.digestSubscriptions.filter((row) => row.isEnabled).length;
  const totalCount = input.digestSubscriptions.length;

  if (totalCount === 0) {
    return {
      kind: "needs-attention",
      label: "Not configured",
      provenanceFact: "No digest subscriptions in this workspace.",
      configureHint: configureHintForChannel("digests"),
    };
  }

  if (enabledCount === 0) {
    return {
      kind: "needs-attention",
      label: "Disabled",
      provenanceFact:
        totalCount === 1
          ? "1 digest subscription is paused."
          : `${totalCount} digest subscriptions are paused.`,
      configureHint: configureHintForChannel("digests"),
    };
  }

  return {
    kind: "ready",
    label: "Connected",
    provenanceFact:
      enabledCount === 1
        ? "1 active digest subscription."
        : `${enabledCount} active digest subscriptions.`,
    configureHint: configureHintForChannel("digests"),
  };
}

function resolveAlertsInboxDeliveryStatus(
  input: NotificationChannelDeliveryStatusInput,
): NotificationChannelDeliveryStatus {
  if (input.alertsLoadState === "loading") {
    return {
      kind: "neutral",
      label: "Loading",
      provenanceFact: null,
      configureHint: configureHintForChannel("alerts-inbox"),
    };
  }

  if (input.alertsLoadState === "error") {
    return notReportedStatus("alerts-inbox");
  }

  if (input.enabledRulesCount === 0) {
    return {
      kind: "needs-attention",
      label: "Not configured",
      provenanceFact: "No enabled alert rules in this workspace.",
      configureHint: configureHintForChannel("alerts-inbox"),
    };
  }

  if (input.openAlertsCount === 0) {
    return {
      kind: "ready",
      label: "Connected",
      provenanceFact: "No open alerts right now.",
      configureHint: configureHintForChannel("alerts-inbox"),
    };
  }

  return {
    kind: "ready",
    label: "Connected",
    provenanceFact:
      input.openAlertsCount === 1
        ? "1 open alert."
        : `${input.openAlertsCount} open alerts.`,
    configureHint: configureHintForChannel("alerts-inbox"),
  };
}

function resolveAlertRulesDeliveryStatus(
  input: NotificationChannelDeliveryStatusInput,
): NotificationChannelDeliveryStatus {
  if (input.alertsLoadState === "loading") {
    return {
      kind: "neutral",
      label: "Loading",
      provenanceFact: null,
      configureHint: configureHintForChannel("alert-rules"),
    };
  }

  if (input.alertsLoadState === "error") {
    return notReportedStatus("alert-rules");
  }

  if (input.enabledRulesCount === 0) {
    return {
      kind: "needs-attention",
      label: "Not configured",
      provenanceFact: "No enabled alert rules.",
      configureHint: configureHintForChannel("alert-rules"),
    };
  }

  if (input.enabledRoutingCount === 0) {
    return {
      kind: "needs-attention",
      label: "Disabled",
      provenanceFact:
        input.enabledRulesCount === 1
          ? "1 enabled rule with no routing destinations."
          : `${input.enabledRulesCount} enabled rules with no routing destinations.`,
      configureHint: configureHintForChannel("alert-rules"),
    };
  }

  return {
    kind: "ready",
    label: "Connected",
    provenanceFact:
      input.enabledRoutingCount === 1
        ? "1 enabled routing destination."
        : `${input.enabledRoutingCount} enabled routing destinations.`,
    configureHint: configureHintForChannel("alert-rules"),
  };
}

function resolveTeamsDeliveryStatus(
  input: NotificationChannelDeliveryStatusInput,
): NotificationChannelDeliveryStatus {
  if (input.teamsLoadState === "loading") {
    return {
      kind: "neutral",
      label: "Loading",
      provenanceFact: null,
      configureHint: configureHintForChannel("teams"),
    };
  }

  if (input.teamsLoadState === "error") {
    return notReportedStatus("teams");
  }

  const connectionStatus = resolveTeamsIntegrationConnectionStatus({
    isConfigured: input.teamsIsConfigured,
    enabledTriggerCount: input.teamsEnabledTriggerCount,
    hasConnectionIssue: false,
  });
  const label = teamsIntegrationConnectionStatusLabel(connectionStatus);
  const kind = teamsIntegrationConnectionStatusTagKind(connectionStatus);

  let provenanceFact: string | null = null;

  if (input.teamsIsConfigured && input.teamsEnabledTriggerCount > 0) {
    provenanceFact =
      input.teamsEnabledTriggerCount === 1
        ? "1 notification type enabled for Teams."
        : `${input.teamsEnabledTriggerCount} notification types enabled for Teams.`;
  } else if (input.teamsIsConfigured) {
    provenanceFact = "Teams connection saved with no notification types enabled.";
  }

  return {
    kind,
    label,
    provenanceFact,
    configureHint: configureHintForChannel("teams"),
  };
}

function resolveSlackDeliveryStatus(
  input: NotificationChannelDeliveryStatusInput,
): NotificationChannelDeliveryStatus {
  if (input.slackLoadState === "loading") {
    return {
      kind: "neutral",
      label: "Loading",
      provenanceFact: null,
      configureHint: configureHintForChannel("slack"),
    };
  }

  if (input.slackLoadState === "error") {
    return notReportedStatus("slack");
  }

  const label = slackIntegrationConfigurationStatusLabel(input.activeSlackDestinationCount);
  const kind = slackIntegrationConfigurationStatusTagKind(input.activeSlackDestinationCount);
  let provenanceFact: string | null = null;

  if (input.totalSlackDestinationCount === 0) {
    provenanceFact = "No Slack destinations in this workspace.";
  } else if (input.activeSlackDestinationCount === 0) {
    provenanceFact =
      input.totalSlackDestinationCount === 1
        ? "1 Slack destination is disabled."
        : `${input.totalSlackDestinationCount} Slack destinations are disabled.`;
  } else {
    provenanceFact =
      input.activeSlackDestinationCount === 1
        ? "1 active Slack destination."
        : `${input.activeSlackDestinationCount} active Slack destinations.`;
  }

  return {
    kind,
    label,
    provenanceFact,
    configureHint: configureHintForChannel("slack"),
  };
}

export function resolveNotificationChannelDeliveryStatus(
  input: NotificationChannelDeliveryStatusInput,
): NotificationChannelDeliveryStatusMap {
  return {
    digests: resolveDigestsDeliveryStatus(input),
    "alerts-inbox": resolveAlertsInboxDeliveryStatus(input),
    "alert-rules": resolveAlertRulesDeliveryStatus(input),
    teams: resolveTeamsDeliveryStatus(input),
    slack: resolveSlackDeliveryStatus(input),
  };
}

export type NotificationChannelDeliveryStatusMap = Readonly<
  Record<string, NotificationChannelDeliveryStatus>
>;

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