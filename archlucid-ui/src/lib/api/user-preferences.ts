import type { CloudPlatformScope } from "@/lib/cloud-platform-scope-storage";
import * as httpApi from "@/lib/api/http";
import type { ColorModePreference } from "@/lib/color-mode-preference";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

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
  ianaTimeZoneId: string;
  ianaTimeZoneIsExplicit: boolean;
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

export type SetIanaTimeZonePreferenceRequest = {
  ianaTimeZoneId: string;
};

const DEFAULT_CLOUD_PLATFORM_SCOPE_DTO: CloudPlatformScopeDto = {
  "evidence-only": true,
  azure: true,
  aws: true,
  gcp: true,
};

const DEFAULT_IANA_TIME_ZONE_ID = "UTC";

/** Matches prior module-level TTL; TanStack `staleTime` for cross-tree dedupe (TB-2303). */
export const USER_PREFERENCES_STALE_MS = 30_000;

function defaultUserPreferencesResponse(): UserPreferencesResponse {
  return {
    appearancePreference: "system",
    appearancePreferenceIsExplicit: false,
    cloudPlatformScope: DEFAULT_CLOUD_PLATFORM_SCOPE_DTO,
    cloudPlatformScopeIsExplicit: false,
    whereToGoNextEnabled: true,
    whereToGoNextIsExplicit: false,
    ianaTimeZoneId: DEFAULT_IANA_TIME_ZONE_ID,
    ianaTimeZoneIsExplicit: false,
  };
}

function readCachedUserPreferences(): UserPreferencesResponse {
  if (typeof window === "undefined") {
    return defaultUserPreferencesResponse();
  }

  const queryClient = getOperatorQueryClient();
  const cached = queryClient.getQueryData<UserPreferencesResponse>(operatorQueryKeys.userPreferences);

  if (cached === undefined) {
    return defaultUserPreferencesResponse();
  }

  return cached;
}

function patchUserPreferencesCache(patch: Partial<UserPreferencesResponse>): void {
  if (typeof window === "undefined") {
    return;
  }

  const queryClient = getOperatorQueryClient();

  queryClient.setQueryData<UserPreferencesResponse>(operatorQueryKeys.userPreferences, {
    ...readCachedUserPreferences(),
    ...patch,
  });
}

/** Raw fetch for TanStack `queryFn` and SSR callers. */
export async function fetchUserPreferencesFromApi(): Promise<UserPreferencesResponse> {
  return httpApi.apiGet<UserPreferencesResponse>("/v1/user/preferences");
}

export async function invalidateUserPreferencesCache(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.userPreferences });
}

/** Test-only: drop TanStack cache between Vitest cases. */
export function resetUserPreferencesCacheForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  const queryClient = getOperatorQueryClient();

  queryClient.removeQueries({ queryKey: operatorQueryKeys.userPreferences });
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
  if (typeof window === "undefined") {
    return fetchUserPreferencesFromApi();
  }

  const queryClient = getOperatorQueryClient();

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.userPreferences,
    queryFn: fetchUserPreferencesFromApi,
    staleTime: USER_PREFERENCES_STALE_MS,
  });
}

export async function setUserAppearancePreference(value: ColorModePreference): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/appearance",
    { value } satisfies SetAppearancePreferenceRequest,
  );

  patchUserPreferencesCache({
    appearancePreference: value,
    appearancePreferenceIsExplicit: true,
  });
}

export async function setUserCloudPlatformScope(scope: CloudPlatformScope): Promise<void> {
  const dto = toCloudPlatformScopeDto(scope);

  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/cloud-platforms",
    { scope: dto } satisfies SetCloudPlatformScopeRequest,
  );

  patchUserPreferencesCache({
    cloudPlatformScope: dto,
    cloudPlatformScopeIsExplicit: true,
  });
}

export async function setUserWhereToGoNextEnabled(enabled: boolean): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/where-to-go-next",
    { enabled } satisfies SetWhereToGoNextVisibilityRequest,
  );

  patchUserPreferencesCache({
    whereToGoNextEnabled: enabled,
    whereToGoNextIsExplicit: true,
  });
}

export async function setUserIanaTimeZonePreference(ianaTimeZoneId: string): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/time-zone",
    { ianaTimeZoneId } satisfies SetIanaTimeZonePreferenceRequest,
  );

  patchUserPreferencesCache({
    ianaTimeZoneId,
    ianaTimeZoneIsExplicit: true,
  });
}
