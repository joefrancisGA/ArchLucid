/**
 * A/B evaluation: charcoal-first authority theme vs default teal accent hierarchy.
 * @see docs/library/UI_DESIGN_SYSTEM.md
 */

export const AUTHORITY_THEME_STORAGE_KEY = "archlucid_authority_theme";

export type UiAuthorityTheme = "default" | "charcoal";

export const UI_AUTHORITY_THEME_ATTRIBUTE = "data-al-authority-theme";

export function isUiAuthorityTheme(value: string | null | undefined): value is UiAuthorityTheme {
  return value === "default" || value === "charcoal";
}

/** Build-time default when localStorage has no override (`NEXT_PUBLIC_UI_AUTHORITY_THEME`). */
export function resolveAuthorityThemeFromEnv(raw: string | undefined): UiAuthorityTheme {
  const normalized = (raw ?? "").trim().toLowerCase();

  if (normalized === "charcoal" || normalized === "authority" || normalized === "charcoal-authority") {
    return "charcoal";
  }

  return "default";
}

/** When true, operator/marketing shells show a theme toggle for side-by-side evaluation. */
export function isUiAuthorityThemeEvalEnabledEnv(): boolean {
  const raw = (process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME_EVAL ?? "").trim().toLowerCase();

  return raw === "1" || raw === "true";
}

export function readStoredAuthorityTheme(): UiAuthorityTheme | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTHORITY_THEME_STORAGE_KEY);

    if (isUiAuthorityTheme(raw)) {
      return raw;
    }
  } catch {
    // ignore
  }

  return null;
}

export function resolveEffectiveAuthorityTheme(
  stored: UiAuthorityTheme | null,
  envDefault: UiAuthorityTheme,
): UiAuthorityTheme {
  if (stored !== null) {
    return stored;
  }

  return envDefault;
}

export function applyAuthorityThemeToDocument(theme: UiAuthorityTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute(UI_AUTHORITY_THEME_ATTRIBUTE, theme);
}

export function persistAuthorityTheme(theme: UiAuthorityTheme): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(AUTHORITY_THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }

  applyAuthorityThemeToDocument(theme);
}

/** True when localStorage holds an explicit theme override (not the env build default). */
export function hasStoredAuthorityThemeOverride(): boolean {
  return readStoredAuthorityTheme() !== null;
}

/** Clears the browser override and reapplies the build-time default from env. Returns false when storage could not be cleared. */
export function clearStoredAuthorityTheme(envDefault: UiAuthorityTheme): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.removeItem(AUTHORITY_THEME_STORAGE_KEY);
  } catch {
    return false;
  }

  if (readStoredAuthorityTheme() !== null) {
    return false;
  }

  applyAuthorityThemeToDocument(envDefault);

  return true;
}

export function buildAuthorityThemeToggleLabel(theme: UiAuthorityTheme): string {
  const next: UiAuthorityTheme = theme === "charcoal" ? "default" : "charcoal";
  const currentLabel = theme === "charcoal" ? "Charcoal authority" : "Default teal accent";

  return `Visual theme: ${currentLabel}. Activate to switch to ${next === "charcoal" ? "charcoal authority" : "default teal accent"}.`;
}

export function resolveNextAuthorityTheme(theme: UiAuthorityTheme): UiAuthorityTheme {
  return theme === "charcoal" ? "default" : "charcoal";
}
