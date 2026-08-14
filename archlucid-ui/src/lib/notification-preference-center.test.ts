import { describe, expect, it } from "vitest";

import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import { ALERT_ROUTING_TAB_PATH } from "@/lib/alert-routing-evidence-copy";
import { INTEGRATIONS_SLACK_PATH, INTEGRATIONS_TEAMS_PATH } from "@/lib/integrations-nav-paths";
import {
  NOTIFICATION_PREFERENCE_CHANNELS,
  NOTIFICATION_PREFERENCE_CENTER_ORIENTATION_LINE,
  NOTIFICATION_PREFERENCE_CENTER_PATH,
  NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY,
  NOTIFICATION_PREFERENCE_STATUS_HINT_KEYS,
  NOTIFICATION_PREFERENCE_STATUS_HINTS,
  pathMatchesNotificationPreferenceCenter,
  resolveNotificationChannelDeliveryStatus,
  statusHintForNotificationChannel,
  type NotificationChannelDeliveryStatusInput,
} from "@/lib/notification-preference-center";

function baseInput(
  overrides: Partial<NotificationChannelDeliveryStatusInput> = {},
): NotificationChannelDeliveryStatusInput {
  return {
    digestSubscriptions: [],
    digestLoadState: "ready",
    alertsLoadState: "ready",
    enabledRulesCount: 0,
    enabledRoutingCount: 0,
    openAlertsCount: 0,
    teamsLoadState: "ready",
    teamsIsConfigured: false,
    teamsEnabledTriggerCount: 0,
    slackLoadState: "ready",
    activeSlackDestinationCount: 0,
    totalSlackDestinationCount: 0,
    ...overrides,
  };
}

describe("notification-preference-center (TB-2203)", () => {
  it("uses the administration notifications path", () => {
    expect(NOTIFICATION_PREFERENCE_CENTER_PATH).toBe("/administration/notifications");
    expect(pathMatchesNotificationPreferenceCenter("/administration/notifications")).toBe(true);
    expect(pathMatchesNotificationPreferenceCenter("/administration/notifications/")).toBe(true);
    expect(pathMatchesNotificationPreferenceCenter("/account/preferences")).toBe(false);
  });

  it("lists digests, alerts inbox/rules, Teams, and Slack with honest configure CTAs", () => {
    expect(NOTIFICATION_PREFERENCE_CHANNELS.map((channel) => channel.id)).toEqual([
      "digests",
      "alerts-inbox",
      "alert-rules",
      "teams",
      "slack",
    ]);

    expect(NOTIFICATION_PREFERENCE_CHANNELS.find((c) => c.id === "digests")?.href).toBe(
      DIGESTS_SUBSCRIPTIONS_TAB_PATH,
    );
    expect(NOTIFICATION_PREFERENCE_CHANNELS.find((c) => c.id === "alerts-inbox")?.href).toBe(
      "/governance/alerts",
    );
    expect(NOTIFICATION_PREFERENCE_CHANNELS.find((c) => c.id === "alert-rules")?.href).toBe(
      ALERT_ROUTING_TAB_PATH,
    );
    expect(NOTIFICATION_PREFERENCE_CHANNELS.find((c) => c.id === "teams")?.href).toBe(
      INTEGRATIONS_TEAMS_PATH,
    );
    expect(NOTIFICATION_PREFERENCE_CHANNELS.find((c) => c.id === "slack")?.href).toBe(
      INTEGRATIONS_SLACK_PATH,
    );
  });

  it("maps every statusHintKey to configure-in copy and resolves per channel", () => {
    for (const key of NOTIFICATION_PREFERENCE_STATUS_HINT_KEYS) {
      expect(NOTIFICATION_PREFERENCE_STATUS_HINTS[key].toLowerCase()).toContain("configure");
    }

    for (const channel of NOTIFICATION_PREFERENCE_CHANNELS) {
      const hint = statusHintForNotificationChannel(channel);

      expect(hint).toBe(NOTIFICATION_PREFERENCE_STATUS_HINTS[channel.statusHintKey]);
      expect(hint.toLowerCase()).toMatch(/configure|triage/);
    }
  });

  it("exposes buyer-facing orientation and consolidated relations disclosure copy", () => {
    expect(NOTIFICATION_PREFERENCE_CENTER_ORIENTATION_LINE.toLowerCase()).toContain("each channel");
    expect(NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY).toContain("Digests");
    expect(NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY).toContain("Preferences");
    expect(NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY).toContain("Teams");
    expect(NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY).toContain("Slack");
  });

  it("resolves digest delivery status from subscription data", () => {
    const empty = resolveNotificationChannelDeliveryStatus(baseInput());
    expect(empty.digests.label).toBe("Not configured");

    const disabled = resolveNotificationChannelDeliveryStatus(
      baseInput({
        digestSubscriptions: [
          {
            subscriptionId: "s1",
            tenantId: "t1",
            workspaceId: "w1",
            projectId: "p1",
            name: "Weekly",
            channelType: "Email",
            destination: "ops@example.com",
            isEnabled: false,
            createdUtc: "2026-01-01T00:00:00Z",
            metadataJson: "{}",
          },
        ],
      }),
    );
    expect(disabled.digests.label).toBe("Disabled");

    const connected = resolveNotificationChannelDeliveryStatus(
      baseInput({
        digestSubscriptions: [
          {
            subscriptionId: "s1",
            tenantId: "t1",
            workspaceId: "w1",
            projectId: "p1",
            name: "Weekly",
            channelType: "Email",
            destination: "ops@example.com",
            isEnabled: true,
            createdUtc: "2026-01-01T00:00:00Z",
            metadataJson: "{}",
          },
        ],
      }),
    );
    expect(connected.digests.label).toBe("Connected");
    expect(connected.digests.provenanceFact).toContain("1 active digest subscription");
  });

  it("resolves alert inbox and rules status without paraphrasing CTA labels", () => {
    const inboxNotConfigured = resolveNotificationChannelDeliveryStatus(baseInput());
    expect(inboxNotConfigured["alerts-inbox"].label).toBe("Not configured");
    expect(inboxNotConfigured["alert-rules"].label).toBe("Not configured");

    const routingReady = resolveNotificationChannelDeliveryStatus(
      baseInput({
        enabledRulesCount: 2,
        enabledRoutingCount: 1,
        openAlertsCount: 3,
      }),
    );
    expect(routingReady["alerts-inbox"].label).toBe("Connected");
    expect(routingReady["alerts-inbox"].provenanceFact).toContain("3 open governance alerts");
    expect(routingReady["alert-rules"].label).toBe("Connected");
    expect(routingReady["alert-rules"].configureHint.toLowerCase()).toContain("alert rules");
  });

  it("resolves Teams and Slack status from integration signals", () => {
    const teamsConnected = resolveNotificationChannelDeliveryStatus(
      baseInput({
        teamsIsConfigured: true,
        teamsEnabledTriggerCount: 2,
      }),
    );
    expect(teamsConnected.teams.label).toBe("Connected");

    const slackConnected = resolveNotificationChannelDeliveryStatus(
      baseInput({
        activeSlackDestinationCount: 1,
        totalSlackDestinationCount: 1,
      }),
    );
    expect(slackConnected.slack.label).toBe("1 active destination");
  });

  it("returns honest not-reported status when channel APIs fail", () => {
    const failed = resolveNotificationChannelDeliveryStatus(
      baseInput({
        digestLoadState: "error",
        alertsLoadState: "error",
        teamsLoadState: "error",
        slackLoadState: "error",
      }),
    );

    for (const channel of NOTIFICATION_PREFERENCE_CHANNELS) {
      expect(failed[channel.id].label).toBe("Not reported here");
    }
  });
});
