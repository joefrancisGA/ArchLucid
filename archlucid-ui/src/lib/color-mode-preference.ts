export const COLOR_MODE_STORAGE_KEY = "archlucid_color_mode";

export const COLOR_MODE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE =
  "Saved on this device only. Account sync failed — check connectivity and try again.";

export type ColorModePreference = "light" | "dark" | "system";

export type ResolvedColorModeAppearance = "light" | "dark";

const LEGACY_COLOR_MODE_ALIASES_TO_SYSTEM = new Set([
  "auto",
  "default",
  "teal",
  "charcoal",
  "authority",
  "charcoal-authority",
]);

export function normalizeColorModePreference(value: string | null | undefined): ColorModePreference {
  if (value === null || value === undefined) {
    return "system";
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "system";
  }

  const normalized = trimmed.toLowerCase();

  if (normalized === "light" || normalized === "dark" || normalized === "system") {
    return normalized;
  }

  if (LEGACY_COLOR_MODE_ALIASES_TO_SYSTEM.has(normalized)) {
    return "system";
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

/** Resolved appearance for rendering. Never persist this value as the user preference. */
export function resolveColorModeAppearance(
  preference: ColorModePreference,
  systemPrefersDark: boolean,
): ResolvedColorModeAppearance {
  return resolveDarkAppearance(preference, systemPrefersDark) ? "dark" : "light";
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

export function clearCachedColorModePreference(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
  }
  catch {
    // ignore
  }

  const systemPrefersDark = readSystemPrefersDark();

  applyColorModePreference("system", systemPrefersDark);
}

/** When authenticated, server preference wins over stale localStorage. */
export async function syncColorModePreferenceFromServer(): Promise<ColorModePreference | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    // Dynamic import keeps this module free of an eager cycle with user-preferences → http (Vitest mocks).
    const { getUserPreferences } = await import("@/lib/api/user-preferences");
    const remote = await getUserPreferences();
    const systemPrefersDark = readSystemPrefersDark();
    const localPreference = readStoredColorModePreference();

    if (!remote.appearancePreferenceIsExplicit && localPreference !== "system") {
      await persistColorModePreferenceToServer(localPreference);
      persistColorModePreference(localPreference, systemPrefersDark);

      return localPreference;
    }

    const normalized = normalizeColorModePreference(remote.appearancePreference);

    persistColorModePreference(normalized, systemPrefersDark);

    return normalized;
  }
  catch {
    // Anonymous, offline, or API unavailable — keep localStorage fallback.
    return null;
  }
}

export async function persistColorModePreferenceToServer(
  preference: ColorModePreference,
): Promise<boolean> {
  try {
    const { setUserAppearancePreference } = await import("@/lib/api/user-preferences");
    await setUserAppearancePreference(preference);

    return true;
  }
  catch {
    // localStorage remains the immediate fallback for demo/offline sessions.
    return false;
  }
}
