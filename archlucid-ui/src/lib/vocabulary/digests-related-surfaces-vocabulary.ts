/**
 * Digests hub "Get started" → one related-surfaces line.
 *
 * The tab previously mounted four vocabulary rails at once: Digests ≠ Notifications
 * (TB-2254), Digests ≠ Teams / Slack (TB-2325), Digests ≠ Advisory scans (TB-2314), and
 * the Browse / Schedule / Subscriptions triad (TB-2290). Each rail was authored on its own
 * backlog row and none knew the others were mounted, so every one of them restated what a
 * digest is before it could contrast it with one neighbour — four definitions above the
 * fold, in vaguer language ("content cadence", "email cadence", "summary content cadence")
 * than the page subtitle already sitting above them.
 *
 * The routing value in those rails is the destination name, not the contrast sentence: an
 * operator who came here looking for Slack alerts needs the word "Slack" and a way out, not
 * a sentence explaining that Slack is not email. So the three peer rails collapse to one
 * line of links, and the triad rail is dropped outright because the hub tab list renders
 * directly above it and already names those three tabs.
 *
 * Hrefs and labels are reused from the original vocabulary modules so the reciprocal rails
 * still mounted on Notifications, Teams, Slack, and Advisory scans cannot drift from this
 * line.
 */

import { DIGESTS_ADVISORY_SCANS_ADVISORY_LINK } from "@/lib/vocabulary/digests-advisory-scans-vocabulary";
import { DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK } from "@/lib/vocabulary/digests-notifications-vocabulary";
import {
  DIGESTS_TEAMS_SLACK_SLACK_LINK,
  DIGESTS_TEAMS_SLACK_TEAMS_LINK,
} from "@/lib/vocabulary/digests-teams-slack-vocabulary";

export type DigestsRelatedSurfaceId = "notifications" | "teams" | "slack" | "advisory-scans";

export type DigestsRelatedSurfaceLink = {
  readonly id: DigestsRelatedSurfaceId;
  readonly label: string;
  readonly href: string;
};

export const DIGESTS_RELATED_SURFACES_COMPACT_LINE = "Looking for something else?" as const;

export const DIGESTS_RELATED_SURFACES_HEADING = "Related delivery surfaces" as const;

/**
 * Full-variant fallback. Keeps the four contrasts the collapsed rails carried, stated once
 * and defining a digest once, for any surface that opts into the expanded rail.
 */
export const DIGESTS_RELATED_SURFACES_WHY =
  "Digests are scheduled email summaries. Notifications is where you choose which channel to configure, Microsoft Teams and Slack deliver chat alerts, and Advisory scans produce the findings a digest summarizes." as const;

const RELATED_LINKS: readonly DigestsRelatedSurfaceLink[] = [
  {
    id: "notifications",
    label: DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK.label,
    href: DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK.href,
  },
  {
    id: "teams",
    label: DIGESTS_TEAMS_SLACK_TEAMS_LINK.label,
    href: DIGESTS_TEAMS_SLACK_TEAMS_LINK.href,
  },
  {
    id: "slack",
    label: DIGESTS_TEAMS_SLACK_SLACK_LINK.label,
    href: DIGESTS_TEAMS_SLACK_SLACK_LINK.href,
  },
  {
    id: "advisory-scans",
    label: DIGESTS_ADVISORY_SCANS_ADVISORY_LINK.label,
    href: DIGESTS_ADVISORY_SCANS_ADVISORY_LINK.href,
  },
];

/** Peer surfaces an operator may have expected to find on the digests hub. */
export function buildDigestsRelatedSurfaceLinks(): readonly DigestsRelatedSurfaceLink[] {
  return RELATED_LINKS;
}
