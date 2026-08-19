import * as httpApi from "@/lib/api/http";
import type { ColorModePreference } from "@/lib/color-mode-preference";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export type UserPreferencesResponse = {
  appearancePreference: ColorModePreference;
  appearancePreferenceIsExplicit: boolean;
};

export type SetAppearancePreferenceRequest = {
  value: ColorModePreference;
};

/** Matches prior module-level TTL; TanStack `staleTime` for cross-tree dedupe (TB-2303). */
export const USER_PREFERENCES_STALE_MS = 30_000;

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

  if (typeof window === "undefined") {
    return;
  }

  getOperatorQueryClient().setQueryData<UserPreferencesResponse>(operatorQueryKeys.userPreferences, {
    appearancePreference: value,
    appearancePreferenceIsExplicit: true,
  });
}
