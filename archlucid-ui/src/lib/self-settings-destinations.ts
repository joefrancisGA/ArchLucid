import { ACCOUNT_PREFERENCES_PATH, ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";
import {
  ACCOUNT_SECURITY_PAGE_TITLE,
  ACCOUNT_SECURITY_SELF_SETTINGS_DESCRIPTION,
} from "@/lib/account-security-page-copy";
import {
  NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE,
  NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
} from "@/lib/notification-preference-center";

/** One user-scoped settings destination shown in the top-bar account menu. */
export type SelfSettingsDestination = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
};

/**
 * Registry of account-menu settings: personal writes, plus read-only preference hubs that only link elsewhere.
 *
 * These are deliberately **not** in `SETTINGS_MASTER_SECTIONS`: the settings hub is the tenant-administration
 * surface and filters personal destinations out (see `settings-master-audience.ts`), so listing them there
 * would hide personal settings behind an admin gate. Add new user-scoped settings here.
 *
 * Destinations that write only the caller's own record live under `/account` (`account-route-paths.ts`).
 * A hub that writes nothing personal keeps its `/administration` URL even when listed here — menu
 * placement is about discovery, while the URL prefix states who owns the records the page writes.
 */
export const SELF_SETTINGS_DESTINATIONS: readonly SelfSettingsDestination[] = [
  {
    id: "user-preferences",
    title: "Preferences",
    description: "Appearance and other personal settings.",
    href: ACCOUNT_PREFERENCES_PATH,
  },
  {
    id: "notification-preferences",
    title: NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
    description: NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE,
    href: SETTINGS_NOTIFICATIONS_PATH,
  },
  {
    id: "account-security",
    title: ACCOUNT_SECURITY_PAGE_TITLE,
    description: ACCOUNT_SECURITY_SELF_SETTINGS_DESCRIPTION,
    href: ACCOUNT_SECURITY_PATH,
  },
] as const;

/** True when `pathname` is one of the user-scoped settings destinations. */
export function isSelfSettingsPath(pathname: string): boolean {
  return SELF_SETTINGS_DESTINATIONS.some((destination) => destination.href === pathname);
}
