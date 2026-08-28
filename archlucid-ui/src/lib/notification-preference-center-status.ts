import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  resolveTeamsIntegrationConnectionStatus,
  teamsIntegrationConnectionStatusLabel,
  teamsIntegrationConnectionStatusTagKind,
} from "@/lib/teams-integration-page-copy";
import {
  slackIntegrationConfigurationStatusLabel,
  slackIntegrationConfigurationStatusTagKind,
} from "@/lib/slack-integration-page-copy";
import type { DigestSubscription } from "@/types/digest-subscriptions";

import { NOTIFICATION_PREFERENCE_CHANNELS } from "./notification-preference-center-channels";
import { NOTIFICATION_PREFERENCE_STATUS_HINTS } from "./notification-preference-center-copy";

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

export type NotificationChannelDeliveryStatusMap = Readonly<
  Record<string, NotificationChannelDeliveryStatus>
>;

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
