/**
 * TB-2295 — Preferences ≠ Notifications vocabulary rail.
 *
 * Why two surfaces exist:
 * - Preferences (`/account/preferences`) is personal appearance/theme
 *   settings for your account.
 * - Notifications (`/administration/notifications`) is the channel preference
 *   launcher for digests, alerts, Teams, and Slack configure pages.
 *
 * They stay separate because choosing a theme is not the same task as choosing
 * which notification channels to configure. Distinct from Digests≠Notifications
 * (TB-2254).
 */

import { ACCOUNT_PREFERENCES_PATH } from "@/lib/account-route-paths";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type PreferencesNotificationsSurfaceId = "preferences" | "notifications";

export type PreferencesNotificationsLink = {
  readonly id: PreferencesNotificationsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PreferencesNotificationsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly preferencesLink: PreferencesNotificationsLink;
  readonly notificationsLink: PreferencesNotificationsLink;
};

export const PREFERENCES_NOTIFICATIONS_HEADING =
  "Preferences and Notifications serve different purposes" as const;

export const PREFERENCES_NOTIFICATIONS_WHY_TWO =
  "Preferences is personal appearance and theme settings for your account. Notifications is the channel preference launcher for digests, alerts, Teams, and Slack. Changing your theme does not configure notification channels." as const;

export const PREFERENCES_NOTIFICATIONS_COMPACT_LINE =
  "Preferences is appearance; Notifications launches channel settings." as const;

export const PREFERENCES_NOTIFICATIONS_PREFERENCES_LINK: PreferencesNotificationsLink = {
  id: "preferences",
  label: "Preferences",
  href: ACCOUNT_PREFERENCES_PATH,
  whenToUse: "Set personal appearance and theme for your account.",
};

export const PREFERENCES_NOTIFICATIONS_NOTIFICATIONS_LINK: PreferencesNotificationsLink = {
  id: "notifications",
  label: "Notifications",
  href: SETTINGS_NOTIFICATIONS_PATH,
  whenToUse: "Open the preference launcher for digests, alerts, Teams, and Slack.",
};

/** Pairwise model for Preferences ↔ Notifications (fixed routes). */
export function buildPreferencesNotificationsPairwiseRail(): PairwiseVocabularyRailModel<PreferencesNotificationsSurfaceId> {
  return {
    heading: PREFERENCES_NOTIFICATIONS_HEADING,
    whyTwo: PREFERENCES_NOTIFICATIONS_WHY_TWO,
    compactLine: PREFERENCES_NOTIFICATIONS_COMPACT_LINE,
    currentLink: PREFERENCES_NOTIFICATIONS_PREFERENCES_LINK,
    peerLink: PREFERENCES_NOTIFICATIONS_NOTIFICATIONS_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildPreferencesNotificationsVocabulary(): PreferencesNotificationsVocabularyModel {
  const rail = buildPreferencesNotificationsPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    preferencesLink: rail.currentLink,
    notificationsLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolvePreferencesNotificationsPeerLink(
  currentSurfaceId: PreferencesNotificationsSurfaceId,
): PreferencesNotificationsLink {
  if (currentSurfaceId === "preferences") {
    return PREFERENCES_NOTIFICATIONS_NOTIFICATIONS_LINK;
  }

  return PREFERENCES_NOTIFICATIONS_PREFERENCES_LINK;
}
