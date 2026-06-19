import { getUserPreferences, setUserAppearancePreference } from "@/lib/api/user-preferences";

export const COLOR_MODE_STORAGE_KEY = "archlucid_color_mode";

export type ColorModePreference = "light" | "dark" | "system";

export function normalizeColorModePreference(value: string | null | undefined): ColorModePreference {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

export function readStoredColorModePreference(): ColorModePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    return normalizeColorModePreference(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY));
  }
  catch {
    return "system";
  }
}

export function writeStoredColorModePreference(preference: ColorModePreference): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, preference);
  }
  catch {
    // ignore
  }
}

export function readSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Whether the UI is currently showing dark styling for the stored preference. */
export function resolveDarkAppearance(
  preference: ColorModePreference,
  systemPrefersDark: boolean,
): boolean {
  if (preference === "dark") {
    return true;
  }

  if (preference === "light") {
    return false;
  }

  return systemPrefersDark;
}

/** light → dark → system → opposite of current system appearance (not a redundant light click). */
export function resolveNextColorModePreference(
  preference: ColorModePreference,
  systemPrefersDark: boolean,
): ColorModePreference {
  if (preference === "light") {
    return "dark";
  }

  if (preference === "dark") {
    return "system";
  }

  return resolveDarkAppearance("system", systemPrefersDark) ? "light" : "dark";
}

export function buildColorModeToggleLabel(
  preference: ColorModePreference,
  systemPrefersDark: boolean,
): string {
  const resolvedDark = resolveDarkAppearance(preference, systemPrefersDark);
  const appearance = resolvedDark ? "dark" : "light";
  const nextMode = resolveNextColorModePreference(preference, systemPrefersDark);

  if (preference === "system") {
    const nextAppearance = resolveDarkAppearance(nextMode, systemPrefersDark) ? "dark" : "light";

    return `Color mode: system (${appearance}). Activate to switch to ${nextAppearance}.`;
  }

  if (nextMode === "system") {
    const systemAppearance = systemPrefersDark ? "dark" : "light";

    return `Color mode: ${preference}. Activate to match system (${systemAppearance}).`;
  }

  return `Color mode: ${preference}. Activate to switch to ${nextMode}.`;
}

export function applyColorModePreference(
  preference: ColorModePreference,
  systemPrefersDark: boolean,
): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement.classList;
  const dark = resolveDarkAppearance(preference, systemPrefersDark);

  if (dark) {
    root.add("dark");
  }
  else {
    root.remove("dark");
  }
}

export function persistColorModePreference(
  preference: ColorModePreference,
  systemPrefersDark: boolean,
): void {
  writeStoredColorModePreference(preference);
  applyColorModePreference(preference, systemPrefersDark);
}

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
