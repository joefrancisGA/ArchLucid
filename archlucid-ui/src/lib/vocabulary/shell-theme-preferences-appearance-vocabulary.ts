/**
 * TB-2328 — Shell theme toggle ≠ Preferences appearance vocabulary rail.
 *
 * Why two surfaces exist:
 * - Shell theme toggle (top-bar `ColorModeToggle`) is a quick light / dark /
 *   system cycle in operator chrome. It has no dedicated route.
 * - Preferences Appearance (`/administration/preferences`, Appearance card /
 *   `ThemePreferenceSelector`) is the durable account theme setting saved to
 *   the user preferences API.
 *
 * They stay separate because a quick chrome cycle is not the same task as
 * saving your account appearance preference. Distinct from Preferences ≠
 * Notifications (TB-2295).
 */

import { SETTINGS_PREFERENCES_PATH } from "@/lib/settings-admin-route-paths";

/**
 * Shell ColorModeToggle has no dedicated route (chrome control only).
 * Hash is documentation/symmetry for Link-shaped models — peer resolution
 * never returns the shell link from Preferences (links=[]).
 */
export const SHELL_THEME_TOGGLE_NO_ROUTE_HREF = "#shell-theme-toggle" as const;

export type ShellThemePreferencesAppearanceSurfaceId =
  | "shell-theme-toggle"
  | "preferences-appearance";

export type ShellThemePreferencesAppearanceLink = {
  readonly id: ShellThemePreferencesAppearanceSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ShellThemePreferencesAppearanceVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly shellThemeToggleLink: ShellThemePreferencesAppearanceLink;
  readonly preferencesAppearanceLink: ShellThemePreferencesAppearanceLink;
};

export const SHELL_THEME_PREFERENCES_APPEARANCE_HEADING =
  "Shell theme toggle and Preferences appearance serve different purposes" as const;

export const SHELL_THEME_PREFERENCES_APPEARANCE_WHY_TWO =
  "The top-bar theme toggle quickly cycles light, dark, or system in shell chrome. Preferences Appearance is the durable account theme setting. A quick chrome cycle is not the same task as saving your account appearance preference." as const;

export const SHELL_THEME_PREFERENCES_APPEARANCE_COMPACT_LINE =
  "Shell toggle cycles light/dark/system quickly; Preferences Appearance saves your account theme — open Preferences when you need the durable setting." as const;

/**
 * Shell ColorModeToggle is chrome-only (no dedicated route).
 * Label is for currentLabel when mounted on shell; peer resolution never
 * returns this link from Preferences (links=[]).
 */
export const SHELL_THEME_PREFERENCES_APPEARANCE_SHELL_LINK: ShellThemePreferencesAppearanceLink =
  {
    id: "shell-theme-toggle",
    label: "Shell theme toggle",
    href: SHELL_THEME_TOGGLE_NO_ROUTE_HREF,
    whenToUse: "Cycle light, dark, or system appearance quickly from the top bar.",
  };

export const SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK: ShellThemePreferencesAppearanceLink =
  {
    id: "preferences-appearance",
    label: "Preferences appearance",
    href: SETTINGS_PREFERENCES_PATH,
    whenToUse: "Set the durable account theme via ThemePreferenceSelector.",
  };

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildShellThemePreferencesAppearanceVocabulary(): ShellThemePreferencesAppearanceVocabularyModel {
  return {
    heading: SHELL_THEME_PREFERENCES_APPEARANCE_HEADING,
    whyTwo: SHELL_THEME_PREFERENCES_APPEARANCE_WHY_TWO,
    compactLine: SHELL_THEME_PREFERENCES_APPEARANCE_COMPACT_LINE,
    shellThemeToggleLink: SHELL_THEME_PREFERENCES_APPEARANCE_SHELL_LINK,
    preferencesAppearanceLink: SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK,
  };
}

/**
 * Peer deep-link for the surface you are not currently on.
 * Shell has no route — from Preferences there is no peer link (null).
 * From shell, peer is Preferences appearance.
 */
export function resolveShellThemePreferencesAppearancePeerLink(
  currentSurfaceId: ShellThemePreferencesAppearanceSurfaceId,
): ShellThemePreferencesAppearanceLink | null {
  if (currentSurfaceId === "shell-theme-toggle") {
    return SHELL_THEME_PREFERENCES_APPEARANCE_PREFERENCES_LINK;
  }

  return null;
}
