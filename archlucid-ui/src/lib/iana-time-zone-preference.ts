import { resolveBrowserTimeZoneId } from "@/lib/advisory-schedule-form";
import { toStoredIanaTimeZoneId } from "@/lib/iana-time-zone-select";

export const IANA_TIME_ZONE_PREFERENCE_STORAGE_KEY = "archlucid.iana-time-zone-preference.v1";

export const IANA_TIME_ZONE_PREFERENCE_CHANGED_EVENT = "archlucid:iana-time-zone-preference-changed";

export const DEFAULT_IANA_TIME_ZONE_PREFERENCE = "UTC";

function dispatchIanaTimeZonePreferenceChanged(): void {
  window.dispatchEvent(new CustomEvent(IANA_TIME_ZONE_PREFERENCE_CHANGED_EVENT));
}

export function normalizeIanaTimeZonePreference(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return DEFAULT_IANA_TIME_ZONE_PREFERENCE;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return DEFAULT_IANA_TIME_ZONE_PREFERENCE;
  }

  return toStoredIanaTimeZoneId(trimmed);
}

export function readStoredIanaTimeZonePreference(): string {
  if (typeof window === "undefined") {
    return DEFAULT_IANA_TIME_ZONE_PREFERENCE;
  }

  try {
    const raw = window.localStorage.getItem(IANA_TIME_ZONE_PREFERENCE_STORAGE_KEY);

    if (raw === null || raw.length === 0) {
      return resolveBrowserTimeZoneId();
    }

    return normalizeIanaTimeZonePreference(raw);
  }
  catch {
    return resolveBrowserTimeZoneId();
  }
}

export function writeStoredIanaTimeZonePreference(ianaTimeZoneId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(IANA_TIME_ZONE_PREFERENCE_STORAGE_KEY, normalizeIanaTimeZonePreference(ianaTimeZoneId));
  dispatchIanaTimeZonePreferenceChanged();
}

export function persistIanaTimeZonePreferenceLocally(ianaTimeZoneId: string): void {
  writeStoredIanaTimeZonePreference(ianaTimeZoneId);
}

export async function syncIanaTimeZonePreferenceFromServer(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getUserPreferences, setUserIanaTimeZonePreference } = await import("@/lib/api/user-preferences");
    const remote = await getUserPreferences();
    const localTimeZoneId = readStoredIanaTimeZonePreference();
    const normalizedRemote = normalizeIanaTimeZonePreference(remote.ianaTimeZoneId);

    if (!remote.ianaTimeZoneIsExplicit && localTimeZoneId !== normalizedRemote) {
      await setUserIanaTimeZonePreference(localTimeZoneId);
      persistIanaTimeZonePreferenceLocally(localTimeZoneId);

      return localTimeZoneId;
    }

    persistIanaTimeZonePreferenceLocally(normalizedRemote);

    return normalizedRemote;
  }
  catch {
    return null;
  }
}

export async function persistIanaTimeZonePreferenceToServer(ianaTimeZoneId: string): Promise<boolean> {
  try {
    const { setUserIanaTimeZonePreference } = await import("@/lib/api/user-preferences");
    await setUserIanaTimeZonePreference(ianaTimeZoneId);

    return true;
  }
  catch {
    return false;
  }
}

export async function persistIanaTimeZonePreference(ianaTimeZoneId: string): Promise<boolean> {
  const normalized = normalizeIanaTimeZonePreference(ianaTimeZoneId);

  persistIanaTimeZonePreferenceLocally(normalized);

  return persistIanaTimeZonePreferenceToServer(normalized);
}

/** Clears personal time zone between Vitest cases. */
export function resetIanaTimeZonePreferenceSessionStateForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(IANA_TIME_ZONE_PREFERENCE_STORAGE_KEY);
}

export function subscribeIanaTimeZonePreferenceChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => {
    onChange();
  };

  window.addEventListener(IANA_TIME_ZONE_PREFERENCE_CHANGED_EVENT, handler);

  return () => {
    window.removeEventListener(IANA_TIME_ZONE_PREFERENCE_CHANGED_EVENT, handler);
  };
}
