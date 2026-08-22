/**
 * TB-2247 — Teams ≠ Slack notification vocabulary rail.
 *
 * Why two channel surfaces exist:
 * - Microsoft Teams (`/integrations/teams`) configures Teams webhook delivery
 *   for alerts in this workspace.
 * - Slack (`/integrations/slack`) configures Slack webhook destinations for the
 *   same alert routing task on a different channel.
 *
 * The notifications hub (`/administration/notifications`) links both as
 * separate channels. They stay separate because Teams and Slack are different
 * products with different destinations — do not treat one setup as the other.
 */

import {
  INTEGRATIONS_SLACK_PATH,
  INTEGRATIONS_TEAMS_PATH,
} from "@/lib/integrations-nav-paths";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";
import type { VocabularyPeerLinkFields } from "@/lib/vocabulary/vocabulary-peer-link-fields";

export type TeamsSlackNotificationSurfaceId = "notifications-hub" | "teams" | "slack";

export type TeamsSlackNotificationLink = VocabularyPeerLinkFields & {
  readonly id: Exclude<TeamsSlackNotificationSurfaceId, "notifications-hub">;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type TeamsSlackNotificationVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly hubHref: string;
  readonly teamsLink: TeamsSlackNotificationLink;
  readonly slackLink: TeamsSlackNotificationLink;
};

export const TEAMS_SLACK_NOTIFICATION_HEADING =
  "Teams and Slack are different notification channels" as const;

export const TEAMS_SLACK_NOTIFICATION_WHY_TWO =
  "Microsoft Teams and Slack each deliver alerts through their own webhook destinations. Configure the channel your workspace actually uses — setting up one destination does not configure the other." as const;

export const TEAMS_SLACK_NOTIFICATION_COMPACT_LINE =
  "Teams and Slack are separate notification channels — open the other channel when you need that destination." as const;

export const TEAMS_SLACK_NOTIFICATION_TEAMS_LINK: TeamsSlackNotificationLink = {
  id: "teams",
  label: "Microsoft Teams",
  href: INTEGRATIONS_TEAMS_PATH,
  whenToUse: "Configure Teams webhook delivery for alerts.",
  compactLineAnchor: "Teams",
};

export const TEAMS_SLACK_NOTIFICATION_SLACK_LINK: TeamsSlackNotificationLink = {
  id: "slack",
  label: "Slack",
  href: INTEGRATIONS_SLACK_PATH,
  whenToUse: "Configure Slack webhook destinations for alerts.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildTeamsSlackNotificationVocabulary(): TeamsSlackNotificationVocabularyModel {
  return {
    heading: TEAMS_SLACK_NOTIFICATION_HEADING,
    whyTwo: TEAMS_SLACK_NOTIFICATION_WHY_TWO,
    compactLine: TEAMS_SLACK_NOTIFICATION_COMPACT_LINE,
    hubHref: SETTINGS_NOTIFICATIONS_PATH,
    teamsLink: TEAMS_SLACK_NOTIFICATION_TEAMS_LINK,
    slackLink: TEAMS_SLACK_NOTIFICATION_SLACK_LINK,
  };
}

/**
 * Peer channel deep-link when mounted on Teams or Slack.
 * Hub mounts show both links instead of a single peer.
 */
export function resolveTeamsSlackNotificationPeerLink(
  currentSurfaceId: Exclude<TeamsSlackNotificationSurfaceId, "notifications-hub">,
): TeamsSlackNotificationLink {
  if (currentSurfaceId === "teams") {
    return TEAMS_SLACK_NOTIFICATION_SLACK_LINK;
  }

  return TEAMS_SLACK_NOTIFICATION_TEAMS_LINK;
}

