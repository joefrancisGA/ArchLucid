/**
 * TB-2325 — Digests (email cadence) ≠ Teams / Slack channel destinations triad.
 *
 * Why three surfaces exist:
 * - Digests (`/architecture/digests`) browse, schedule, and subscribe to
 *   architecture summary *email* content.
 * - Microsoft Teams (`/integrations/teams`) configures Teams webhook delivery
 *   for governance alerts.
 * - Slack (`/integrations/slack`) configures Slack webhook destinations.
 *
 * They stay separate because email digest cadence is not chat-channel alert
 * routing. Distinct from Digests ≠ Notifications (TB-2254) and Teams ≠ Slack
 * (TB-2247).
 */

import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import {
  INTEGRATIONS_SLACK_PATH,
  INTEGRATIONS_TEAMS_PATH,
} from "@/lib/integrations-nav-paths";
import type { VocabularyPeerLinkFields } from "@/lib/vocabulary/vocabulary-peer-link-fields";

export type DigestsTeamsSlackSurfaceId = "digests" | "teams" | "slack";

export type DigestsTeamsSlackLink = VocabularyPeerLinkFields & {
  readonly id: DigestsTeamsSlackSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type DigestsTeamsSlackVocabularyModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly digestsLink: DigestsTeamsSlackLink;
  readonly teamsLink: DigestsTeamsSlackLink;
  readonly slackLink: DigestsTeamsSlackLink;
};

export const DIGESTS_TEAMS_SLACK_HEADING =
  "Digests email cadence is not Teams or Slack alert routing" as const;

export const DIGESTS_TEAMS_SLACK_WHY_THREE =
  "Digests browse, schedule, and subscribe to architecture summary email content. Microsoft Teams and Slack send alert messages to chat channels. Scheduling digest email is separate from configuring Teams or Slack alert delivery." as const;

export const DIGESTS_TEAMS_SLACK_COMPACT_LINE =
  "Digests are email cadence; Teams and Slack are chat alert channels." as const;

export const DIGESTS_TEAMS_SLACK_DIGESTS_LINK: DigestsTeamsSlackLink = {
  id: "digests",
  label: "Digests",
  href: DIGESTS_HUB_PATH,
  whenToUse: "Browse, schedule, and subscribe to architecture digest emails.",
};

export const DIGESTS_TEAMS_SLACK_TEAMS_LINK: DigestsTeamsSlackLink = {
  id: "teams",
  label: "Microsoft Teams",
  href: INTEGRATIONS_TEAMS_PATH,
  whenToUse: "Configure Teams webhook delivery for governance alerts.",
  compactLineAnchor: "Teams",
};

export const DIGESTS_TEAMS_SLACK_SLACK_LINK: DigestsTeamsSlackLink = {
  id: "slack",
  label: "Slack",
  href: INTEGRATIONS_SLACK_PATH,
  whenToUse: "Configure Slack webhook destinations for governance alerts.",
};

const ALL_LINKS: readonly DigestsTeamsSlackLink[] = [
  DIGESTS_TEAMS_SLACK_DIGESTS_LINK,
  DIGESTS_TEAMS_SLACK_TEAMS_LINK,
  DIGESTS_TEAMS_SLACK_SLACK_LINK,
];

/** Full triad vocabulary model (heading, why-three, and deep links). */
export function buildDigestsTeamsSlackVocabulary(): DigestsTeamsSlackVocabularyModel {
  return {
    heading: DIGESTS_TEAMS_SLACK_HEADING,
    whyThree: DIGESTS_TEAMS_SLACK_WHY_THREE,
    compactLine: DIGESTS_TEAMS_SLACK_COMPACT_LINE,
    digestsLink: DIGESTS_TEAMS_SLACK_DIGESTS_LINK,
    teamsLink: DIGESTS_TEAMS_SLACK_TEAMS_LINK,
    slackLink: DIGESTS_TEAMS_SLACK_SLACK_LINK,
  };
}

/** Resolve the link for the current surface (null when unknown). */
export function resolveDigestsTeamsSlackLink(
  surfaceId: DigestsTeamsSlackSurfaceId,
): DigestsTeamsSlackLink | null {
  const match = ALL_LINKS.find((link) => link.id === surfaceId);

  if (match === undefined) {
    return null;
  }

  return match;
}

/** Peer deep-links for the surfaces you are not currently on. */
export function resolveDigestsTeamsSlackPeerLinks(
  currentSurfaceId: DigestsTeamsSlackSurfaceId,
): readonly DigestsTeamsSlackLink[] {
  return ALL_LINKS.filter((link) => link.id !== currentSurfaceId);
}
