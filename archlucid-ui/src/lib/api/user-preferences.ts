import * as httpApi from "@/lib/api/http";
import type { ColorModePreference } from "@/lib/color-mode-preference";

export type UserPreferencesResponse = {
  appearancePreference: ColorModePreference;
  appearancePreferenceIsExplicit: boolean;
};

export type SetAppearancePreferenceRequest = {
  value: ColorModePreference;
};

const USER_PREFERENCES_CACHE_TTL_MS = 30_000;

type CacheEntry = {
  readonly value: UserPreferencesResponse;
  readonly expiresAtMs: number;
};

let cacheEntry: CacheEntry | null = null;
let inFlight: Promise<UserPreferencesResponse> | null = null;
/** Bumped on invalidate so a late in-flight response cannot re-seed the cache. */
let cacheGeneration = 0;

function readFreshCache(nowMs: number): UserPreferencesResponse | null {
  if (cacheEntry === null) {
    return null;
  }

  if (cacheEntry.expiresAtMs <= nowMs) {
    cacheEntry = null;
    return null;
  }

  return cacheEntry.value;
}

function writeCache(value: UserPreferencesResponse, generation: number): void {
  if (generation !== cacheGeneration) {
    return;
  }

  cacheEntry = {
    value,
    expiresAtMs: Date.now() + USER_PREFERENCES_CACHE_TTL_MS,
  };
}

export function invalidateUserPreferencesCache(): void {
  cacheEntry = null;
  inFlight = null;
  cacheGeneration += 1;
}

/** Test-only: clear TTL cache and generation so suites stay isolated. */
export function resetUserPreferencesCacheForTests(): void {
  cacheEntry = null;
  inFlight = null;
  cacheGeneration = 0;
}

export async function getUserPreferences(): Promise<UserPreferencesResponse> {
  const nowMs = Date.now();
  const cached = readFreshCache(nowMs);

  if (cached !== null) {
    return cached;
  }

  if (inFlight !== null) {
    return inFlight;
  }

  const generation = cacheGeneration;

  inFlight = httpApi
    .apiGet<UserPreferencesResponse>("/v1/user/preferences")
    .then((value) => {
      writeCache(value, generation);
      return value;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export async function setUserAppearancePreference(value: ColorModePreference): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/appearance",
    { value } satisfies SetAppearancePreferenceRequest,
  );

  writeCache(
    {
      appearancePreference: value,
      appearancePreferenceIsExplicit: true,
    },
    cacheGeneration,
  );
}
