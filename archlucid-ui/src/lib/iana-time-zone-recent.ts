import { toStoredIanaTimeZoneId } from "@/lib/iana-time-zone-select";

export const IANA_TIME_ZONE_RECENT_STORAGE_KEY = "archlucid.iana-time-zone-recent.v1";

const MAX_RECENT_TIME_ZONES = 5;

export function readRecentIanaTimeZoneIds(): readonly string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(IANA_TIME_ZONE_RECENT_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const seen = new Set<string>();
    const recent: string[] = [];

    for (const value of parsed) {
      if (typeof value !== "string") {
        continue;
      }

      const normalized = toStoredIanaTimeZoneId(value);

      if (seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      recent.push(normalized);

      if (recent.length >= MAX_RECENT_TIME_ZONES) {
        break;
      }
    }

    return recent;
  } catch {
    return [];
  }
}

export function recordRecentIanaTimeZoneId(ianaTimeZoneId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = toStoredIanaTimeZoneId(ianaTimeZoneId);
  const nextRecent = [normalized, ...readRecentIanaTimeZoneIds().filter((id) => id !== normalized)].slice(
    0,
    MAX_RECENT_TIME_ZONES,
  );

  window.localStorage.setItem(IANA_TIME_ZONE_RECENT_STORAGE_KEY, JSON.stringify(nextRecent));
}

/** Clears recent time zones between Vitest cases. */
export function resetRecentIanaTimeZoneIdsForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(IANA_TIME_ZONE_RECENT_STORAGE_KEY);
}
