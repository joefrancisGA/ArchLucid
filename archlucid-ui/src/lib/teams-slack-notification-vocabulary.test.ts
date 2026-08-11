import { describe, expect, it } from "vitest";

import {
  TEAMS_SLACK_NOTIFICATION_COMPACT_LINE,
  TEAMS_SLACK_NOTIFICATION_HEADING,
  TEAMS_SLACK_NOTIFICATION_SLACK_LINK,
  TEAMS_SLACK_NOTIFICATION_TEAMS_LINK,
  TEAMS_SLACK_NOTIFICATION_WHY_TWO,
  buildTeamsSlackNotificationVocabulary,
  resolveTeamsSlackNotificationPeerLink,
} from "@/lib/teams-slack-notification-vocabulary";
import {
  INTEGRATIONS_SLACK_PATH,
  INTEGRATIONS_TEAMS_PATH,
} from "@/lib/integrations-nav-paths";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";

describe("teams-slack-notification-vocabulary (TB-2247)", () => {
  it("explains why Teams and Slack stay separate and deep-links both", () => {
    const model = buildTeamsSlackNotificationVocabulary();

    expect(model.heading).toBe(TEAMS_SLACK_NOTIFICATION_HEADING);
    expect(model.heading.toLowerCase()).toContain("teams");
    expect(model.heading.toLowerCase()).toContain("slack");
    expect(model.whyTwo).toBe(TEAMS_SLACK_NOTIFICATION_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("webhook");
    expect(model.whyTwo.toLowerCase()).toContain("governance alert");
    expect(model.compactLine).toBe(TEAMS_SLACK_NOTIFICATION_COMPACT_LINE);
    expect(model.hubHref).toBe(SETTINGS_NOTIFICATIONS_PATH);
    expect(model.hubHref).toBe("/administration/notifications");

    expect(model.teamsLink).toEqual(TEAMS_SLACK_NOTIFICATION_TEAMS_LINK);
    expect(model.teamsLink.href).toBe(INTEGRATIONS_TEAMS_PATH);
    expect(model.slackLink).toEqual(TEAMS_SLACK_NOTIFICATION_SLACK_LINK);
    expect(model.slackLink.href).toBe(INTEGRATIONS_SLACK_PATH);
  });

  it("resolves the peer channel from Teams and Slack", () => {
    expect(resolveTeamsSlackNotificationPeerLink("teams")).toEqual(
      TEAMS_SLACK_NOTIFICATION_SLACK_LINK,
    );
    expect(resolveTeamsSlackNotificationPeerLink("slack")).toEqual(
      TEAMS_SLACK_NOTIFICATION_TEAMS_LINK,
    );
  });
});
