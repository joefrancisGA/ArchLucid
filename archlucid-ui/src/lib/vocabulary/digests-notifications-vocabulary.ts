/**
 * TB-2254 — Digests ≠ Notifications vocabulary rail.
 *
 * Why two surfaces exist:
 * - Digests (`/architecture/digests`) are the *content cadence* for architecture
 *   summary emails and subscriptions.
 * - Notifications (`/administration/notifications`) is the *preference launcher*
 *   hub that routes operators to digests, alerts, Teams, and Slack configure pages.
 *
 * They stay separate because browsing and scheduling digest content is not the
 * same task as choosing which channel surfaces to configure. Digests appear as
 * one channel on the notifications hub — they are not the same page.
 */

import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type DigestsNotificationsSurfaceId = "digests" | "notifications";

export type DigestsNotificationsLink = {
  readonly id: DigestsNotificationsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type DigestsNotificationsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly digestsLink: DigestsNotificationsLink;
  readonly notificationsLink: DigestsNotificationsLink;
};

export const DIGESTS_NOTIFICATIONS_HEADING =
  "Digests and Notifications serve different purposes" as const;

export const DIGESTS_NOTIFICATIONS_WHY_TWO =
  "Digests are the content cadence for architecture summary emails and subscriptions. Notifications is the preference launcher that opens digests, alerts, Teams, and Slack configure pages. Schedule and browse digest content on Digests; use Notifications when you need to choose which channel to configure." as const;

export const DIGESTS_NOTIFICATIONS_COMPACT_LINE =
  "Digests are content cadence; Notifications is the channel-preference launcher." as const;

export const DIGESTS_NOTIFICATIONS_DIGESTS_LINK: DigestsNotificationsLink = {
  id: "digests",
  label: "Digests",
  href: DIGESTS_HUB_PATH,
  whenToUse: "Browse, subscribe, and schedule architecture digest content cadence.",
};

export const DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK: DigestsNotificationsLink = {
  id: "notifications",
  label: "Notifications",
  href: SETTINGS_NOTIFICATIONS_PATH,
  whenToUse: "Open the preference launcher for digests, alerts, Teams, and Slack.",
};

/** Pairwise model for Digests ↔ Notifications (fixed routes). */
export function buildDigestsNotificationsPairwiseRail(): PairwiseVocabularyRailModel<DigestsNotificationsSurfaceId> {
  return {
    heading: DIGESTS_NOTIFICATIONS_HEADING,
    whyTwo: DIGESTS_NOTIFICATIONS_WHY_TWO,
    compactLine: DIGESTS_NOTIFICATIONS_COMPACT_LINE,
    currentLink: DIGESTS_NOTIFICATIONS_DIGESTS_LINK,
    peerLink: DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildDigestsNotificationsVocabulary(): DigestsNotificationsVocabularyModel {
  const rail = buildDigestsNotificationsPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    digestsLink: rail.currentLink,
    notificationsLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveDigestsNotificationsPeerLink(
  currentSurfaceId: DigestsNotificationsSurfaceId,
): DigestsNotificationsLink {
  if (currentSurfaceId === "digests") {
    return DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK;
  }

  return DIGESTS_NOTIFICATIONS_DIGESTS_LINK;
}

/**
 * Notifications hub path for vocabulary deep links.
 * Intentionally uses SETTINGS_NOTIFICATIONS_PATH (same value as
 * NOTIFICATION_PREFERENCE_CENTER_PATH) to avoid a circular import with
 * notification-preference-center.ts, which composes this vocabulary module.
 */
export function digestsNotificationsPreferenceCenterPath(): string {
  return SETTINGS_NOTIFICATIONS_PATH;
}
