import { describe, expect, it } from "vitest";

import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import { ALERT_ROUTING_TAB_PATH } from "@/lib/alert-routing-evidence-copy";
import { INTEGRATIONS_SLACK_PATH, INTEGRATIONS_TEAMS_PATH } from "@/lib/integrations-nav-paths";
import {
  NOTIFICATION_PREFERENCE_CHANNELS,
  NOTIFICATION_PREFERENCE_CENTER_HUB_DISCLAIMER,
  NOTIFICATION_PREFERENCE_CENTER_PATH,
  NOTIFICATION_PREFERENCE_STATUS_HINT_KEYS,
  NOTIFICATION_PREFERENCE_STATUS_HINTS,
  pathMatchesNotificationPreferenceCenter,
  statusHintForNotificationChannel,
} from "@/lib/notification-preference-center";

describe("notification-preference-center (TB-2203)", () => {
  it("uses the administration notifications path", () => {
    expect(NOTIFICATION_PREFERENCE_CENTER_PATH).toBe("/administration/notifications");
    expect(pathMatchesNotificationPreferenceCenter("/administration/notifications")).toBe(true);
    expect(pathMatchesNotificationPreferenceCenter("/administration/notifications/")).toBe(true);
    expect(pathMatchesNotificationPreferenceCenter("/administration/preferences")).toBe(false);
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

  it("does not claim a unified backend preference API", () => {
    expect(NOTIFICATION_PREFERENCE_CENTER_HUB_DISCLAIMER.toLowerCase()).toContain("hub");
    expect(NOTIFICATION_PREFERENCE_CENTER_HUB_DISCLAIMER.toLowerCase()).not.toContain("api");
    expect(NOTIFICATION_PREFERENCE_CENTER_HUB_DISCLAIMER.toLowerCase()).toContain("not a single");
  });
});