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
 * same job as choosing which channel surfaces to configure. Digests appear as
 * one channel on the notifications hub — they are not the same page.
 */

import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { NOTIFICATION_PREFERENCE_CENTER_PATH } from "@/lib/notification-preference-center";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";

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
  "Digests and Notifications do different jobs" as const;

export const DIGESTS_NOTIFICATIONS_WHY_TWO =
  "Digests are the content cadence for architecture summary emails and subscriptions. Notifications is the preference launcher that opens digests, alerts, Teams, and Slack configure pages. Schedule and browse digest content on Digests; use Notifications when you need to choose which channel to configure." as const;

export const DIGESTS_NOTIFICATIONS_COMPACT_LINE =
  "Digests are content cadence; Notifications launches channel preferences — open the other when you need both." as const;

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

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildDigestsNotificationsVocabulary(): DigestsNotificationsVocabularyModel {
  return {
    heading: DIGESTS_NOTIFICATIONS_HEADING,
    whyTwo: DIGESTS_NOTIFICATIONS_WHY_TWO,
    compactLine: DIGESTS_NOTIFICATIONS_COMPACT_LINE,
    digestsLink: DIGESTS_NOTIFICATIONS_DIGESTS_LINK,
    notificationsLink: DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK,
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

/** Assert notifications hub path aliases stay aligned. */
export function digestsNotificationsPreferenceCenterPath(): string {
  return NOTIFICATION_PREFERENCE_CENTER_PATH;
}
