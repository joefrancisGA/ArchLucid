import type { CloudPlatformScope } from "@/lib/cloud-platform-scope-storage";
import * as httpApi from "@/lib/api/http";
import type { ColorModePreference } from "@/lib/color-mode-preference";

export type CloudPlatformScopeDto = {
  readonly "evidence-only": boolean;
  readonly azure: boolean;
  readonly aws: boolean;
  readonly gcp: boolean;
};

export type UserPreferencesResponse = {
  appearancePreference: ColorModePreference;
  appearancePreferenceIsExplicit: boolean;
  cloudPlatformScope: CloudPlatformScopeDto;
  cloudPlatformScopeIsExplicit: boolean;
  whereToGoNextEnabled: boolean;
  whereToGoNextIsExplicit: boolean;
};

export type SetAppearancePreferenceRequest = {
  value: ColorModePreference;
};

export type SetCloudPlatformScopeRequest = {
  scope: CloudPlatformScopeDto;
};

export type SetWhereToGoNextVisibilityRequest = {
  enabled: boolean;
};

const DEFAULT_CLOUD_PLATFORM_SCOPE_DTO: CloudPlatformScopeDto = {
  "evidence-only": true,
  azure: true,
  aws: true,
  gcp: true,
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

export function toCloudPlatformScopeDto(scope: CloudPlatformScope): CloudPlatformScopeDto {
  return {
    "evidence-only": scope["evidence-only"],
    azure: scope.azure,
    aws: scope.aws,
    gcp: scope.gcp,
  };
}

export function fromCloudPlatformScopeDto(dto: CloudPlatformScopeDto): CloudPlatformScope {
  return {
    "evidence-only": dto["evidence-only"],
    azure: dto.azure,
    aws: dto.aws,
    gcp: dto.gcp,
  };
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

  const cached = readFreshCache(Date.now());

  writeCache(
    {
      appearancePreference: value,
      appearancePreferenceIsExplicit: true,
      cloudPlatformScope: cached?.cloudPlatformScope ?? DEFAULT_CLOUD_PLATFORM_SCOPE_DTO,
      cloudPlatformScopeIsExplicit: cached?.cloudPlatformScopeIsExplicit ?? false,
      whereToGoNextEnabled: cached?.whereToGoNextEnabled ?? true,
      whereToGoNextIsExplicit: cached?.whereToGoNextIsExplicit ?? false,
    },
    cacheGeneration,
  );
}

export async function setUserCloudPlatformScope(scope: CloudPlatformScope): Promise<void> {
  const dto = toCloudPlatformScopeDto(scope);

  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/cloud-platforms",
    { scope: dto } satisfies SetCloudPlatformScopeRequest,
  );

  const cached = readFreshCache(Date.now());

  writeCache(
    {
      appearancePreference: cached?.appearancePreference ?? "system",
      appearancePreferenceIsExplicit: cached?.appearancePreferenceIsExplicit ?? false,
      cloudPlatformScope: dto,
      cloudPlatformScopeIsExplicit: true,
      whereToGoNextEnabled: cached?.whereToGoNextEnabled ?? true,
      whereToGoNextIsExplicit: cached?.whereToGoNextIsExplicit ?? false,
    },
    cacheGeneration,
  );
}

export async function setUserWhereToGoNextEnabled(enabled: boolean): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/where-to-go-next",
    { enabled } satisfies SetWhereToGoNextVisibilityRequest,
  );

  const cached = readFreshCache(Date.now());

  writeCache(
    {
      appearancePreference: cached?.appearancePreference ?? "system",
      appearancePreferenceIsExplicit: cached?.appearancePreferenceIsExplicit ?? false,
      cloudPlatformScope: cached?.cloudPlatformScope ?? DEFAULT_CLOUD_PLATFORM_SCOPE_DTO,
      cloudPlatformScopeIsExplicit: cached?.cloudPlatformScopeIsExplicit ?? false,
      whereToGoNextEnabled: enabled,
      whereToGoNextIsExplicit: true,
    },
    cacheGeneration,
  );
}
