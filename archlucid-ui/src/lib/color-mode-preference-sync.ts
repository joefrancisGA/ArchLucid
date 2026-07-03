import { getUserPreferences, setUserAppearancePreference } from "@/lib/api/user-preferences";
import {
  normalizeColorModePreference,
  persistColorModePreference,
  readSystemPrefersDark,
  type ColorModePreference,
} from "@/lib/color-mode-preference";

/** When authenticated, server preference wins over stale localStorage. */
export async function syncColorModePreferenceFromServer(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const remote = await getUserPreferences();
    const normalized = normalizeColorModePreference(remote.appearancePreference);
    const systemPrefersDark = readSystemPrefersDark();

    persistColorModePreference(normalized, systemPrefersDark);
  }
  catch {
    // Anonymous, offline, or API unavailable — keep localStorage fallback.
  }
}

export async function persistColorModePreferenceToServer(
  preference: ColorModePreference,
): Promise<void> {
  try {
    await setUserAppearancePreference(preference);
  }
  catch {
    // localStorage remains the immediate fallback for demo/offline sessions.
  }
}
