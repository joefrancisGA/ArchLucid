import { resolveBrowserTimeZoneId } from "@/lib/advisory-schedule-form";
import { toStoredIanaTimeZoneId } from "@/lib/iana-time-zone-select";
import { delayForWarmupRetry, WARMUP_MAX_ATTEMPTS } from "@/lib/warmup-retry";

export const IANA_TIME_ZONE_PREFERENCE_STORAGE_KEY = "archlucid.iana-time-zone-preference.v1";

export const IANA_TIME_ZONE_PREFERENCE_CHANGED_EVENT = "archlucid:iana-time-zone-preference-changed";

export const DEFAULT_IANA_TIME_ZONE_PREFERENCE = "UTC";

let inFlightTimeZonePut: Promise<boolean> | null = null;
let queuedTimeZonePutId: string | null = null;
let userPersistIntentDepth = 0;

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

function isUserPersistIntentActive(): boolean {
  return userPersistIntentDepth > 0;
}

/** Marks an in-progress user-initiated persist so mount-time sync does not race a second PUT. */
export function beginIanaTimeZoneUserPersistIntent(): void {
  userPersistIntentDepth += 1;
}

/** Clears a user-initiated persist marker started by {@link beginIanaTimeZoneUserPersistIntent}. */
export function endIanaTimeZoneUserPersistIntent(): void {
  userPersistIntentDepth = Math.max(0, userPersistIntentDepth - 1);
}

function readHttpStatus(err: unknown): number | null {
  if (typeof err !== "object" || err === null) {
    return null;
  }

  const status = Reflect.get(err, "httpStatus");

  return typeof status === "number" ? status : null;
}

function isRetryableTimeZonePutError(err: unknown): boolean {
  return readHttpStatus(err) === 503;
}

async function putIanaTimeZonePreferenceWithRetry(ianaTimeZoneId: string): Promise<boolean> {
  const { setUserIanaTimeZonePreference } = await import("@/lib/api/user-preferences");

  for (let attempt = 0; attempt < WARMUP_MAX_ATTEMPTS; attempt++) {
    try {
      await setUserIanaTimeZonePreference(ianaTimeZoneId);

      return true;
    }
    catch (err) {
      if (!isRetryableTimeZonePutError(err) || attempt >= WARMUP_MAX_ATTEMPTS - 1) {
        return false;
      }

      await delayForWarmupRetry(attempt);
    }
  }

  return false;
}

async function drainQueuedTimeZonePut(): Promise<boolean> {
  let lastOk = true;

  while (queuedTimeZonePutId !== null) {
    const target = queuedTimeZonePutId;
    queuedTimeZonePutId = null;
    lastOk = await putIanaTimeZonePreferenceWithRetry(target);

    if (!lastOk) {
      break;
    }
  }

  return lastOk;
}

export async function syncIanaTimeZonePreferenceFromServer(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getUserPreferences } = await import("@/lib/api/user-preferences");
    const remote = await getUserPreferences();
    const localTimeZoneId = readStoredIanaTimeZonePreference();
    const normalizedRemote = normalizeIanaTimeZonePreference(remote.ianaTimeZoneId);

    if (
      !remote.ianaTimeZoneIsExplicit
      && localTimeZoneId !== normalizedRemote
      && !isUserPersistIntentActive()
    ) {
      const synced = await persistIanaTimeZonePreferenceToServer(localTimeZoneId);

      if (!synced) {
        return null;
      }

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
  const normalized = normalizeIanaTimeZonePreference(ianaTimeZoneId);
  queuedTimeZonePutId = normalized;

  if (inFlightTimeZonePut === null) {
    inFlightTimeZonePut = drainQueuedTimeZonePut().finally(() => {
      inFlightTimeZonePut = null;

      if (queuedTimeZonePutId !== null) {
        void persistIanaTimeZonePreferenceToServer(queuedTimeZonePutId);
      }
    });
  }

  return inFlightTimeZonePut;
}

export async function persistIanaTimeZonePreference(ianaTimeZoneId: string): Promise<boolean> {
  const normalized = normalizeIanaTimeZonePreference(ianaTimeZoneId);

  persistIanaTimeZonePreferenceLocally(normalized);
  beginIanaTimeZoneUserPersistIntent();

  try {
    return await persistIanaTimeZonePreferenceToServer(normalized);
  }
  finally {
    endIanaTimeZoneUserPersistIntent();
  }
}

/** Clears personal time zone between Vitest cases. */
export function resetIanaTimeZonePreferenceSessionStateForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(IANA_TIME_ZONE_PREFERENCE_STORAGE_KEY);
}

/** Clears serialized PUT state between Vitest cases. */
export function resetIanaTimeZonePutSerializationForTests(): void {
  inFlightTimeZonePut = null;
  queuedTimeZonePutId = null;
  userPersistIntentDepth = 0;
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
