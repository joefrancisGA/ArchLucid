/**
 * TB-2290 — Digests Browse ≠ Schedule ≠ Subscriptions vocabulary triad.
 *
 * Why three Digests hub tabs exist:
 * - Get started (`?tab=get-started`) is history of generated digest content.
 * - Schedule (`?tab=schedule`) is executive digest email cadence and recipients.
 * - Subscriptions (`?tab=subscriptions`) are destination subscriptions for
 *   architecture digests after advisory scans.
 *
 * They stay separate because browsing history is not configuring cadence, and
 * cadence is not the same job as managing subscription destinations. Distinct
 * from Digests ≠ Notifications (TB-2254) and Digest ≠ recurrence (TB-2226).
 */

import {
  DIGESTS_BROWSE_TAB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
} from "@/lib/digests-route-paths";

export type DigestsBrowseScheduleSubscriptionsSurfaceId =
  | "get-started"
  | "schedule"
  | "subscriptions";

export type DigestsBrowseScheduleSubscriptionsLink = {
  readonly id: DigestsBrowseScheduleSubscriptionsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type DigestsBrowseScheduleSubscriptionsVocabularyModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly browseLink: DigestsBrowseScheduleSubscriptionsLink;
  readonly scheduleLink: DigestsBrowseScheduleSubscriptionsLink;
  readonly subscriptionsLink: DigestsBrowseScheduleSubscriptionsLink;
};

export const DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_HEADING =
  "Browse, Schedule, and Subscriptions are three different Digests tabs" as const;

export const DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_WHY_THREE =
  "Browse is history of generated digest content. Schedule is the executive digest email cadence and recipients. Subscriptions are delivery destinations for architecture digests after advisory scans. Opening history is not configuring cadence — and cadence is not the same as managing delivery destinations." as const;

export const DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_COMPACT_LINE =
  "Browse is history; Schedule is cadence; Subscriptions are delivery destinations — open the other Digests tab when you need that work." as const;

export const DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_BROWSE_LINK: DigestsBrowseScheduleSubscriptionsLink =
  {
    id: "get-started",
    label: "Browse",
    href: DIGESTS_BROWSE_TAB_PATH,
    whenToUse: "Review generated digest history and open a past summary.",
  };

export const DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SCHEDULE_LINK: DigestsBrowseScheduleSubscriptionsLink =
  {
    id: "schedule",
    label: "Schedule",
    href: DIGESTS_SCHEDULE_TAB_PATH,
    whenToUse: "Configure executive digest email cadence and direct recipients.",
  };

export const DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SUBSCRIPTIONS_LINK: DigestsBrowseScheduleSubscriptionsLink =
  {
    id: "subscriptions",
    label: "Subscriptions",
    href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
    whenToUse: "Manage architecture digest delivery destinations.",
  };

const ALL_LINKS: readonly DigestsBrowseScheduleSubscriptionsLink[] = [
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_BROWSE_LINK,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SCHEDULE_LINK,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SUBSCRIPTIONS_LINK,
];

/** Full triad vocabulary model (heading, why-three, and deep links). */
export function buildDigestsBrowseScheduleSubscriptionsVocabulary(): DigestsBrowseScheduleSubscriptionsVocabularyModel {
  return {
    heading: DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_HEADING,
    whyThree: DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_WHY_THREE,
    compactLine: DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_COMPACT_LINE,
    browseLink: DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_BROWSE_LINK,
    scheduleLink: DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SCHEDULE_LINK,
    subscriptionsLink: DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SUBSCRIPTIONS_LINK,
  };
}

/** Resolve the link for the current surface (null when unknown). */
export function resolveDigestsBrowseScheduleSubscriptionsLink(
  surfaceId: DigestsBrowseScheduleSubscriptionsSurfaceId,
): DigestsBrowseScheduleSubscriptionsLink | null {
  const match = ALL_LINKS.find((link) => link.id === surfaceId);

  if (match === undefined) {
    return null;
  }

  return match;
}

/** Peer deep-links for the Digests tabs you are not currently on. */
export function resolveDigestsBrowseScheduleSubscriptionsPeerLinks(
  currentSurfaceId: DigestsBrowseScheduleSubscriptionsSurfaceId,
): readonly DigestsBrowseScheduleSubscriptionsLink[] {
  return ALL_LINKS.filter((link) => link.id !== currentSurfaceId);
}
