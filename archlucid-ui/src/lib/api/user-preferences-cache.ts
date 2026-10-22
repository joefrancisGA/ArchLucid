import * as httpApi from "@/lib/api/http";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

import {
  defaultUserPreferencesResponse,
  USER_PREFERENCES_STALE_MS,
  type UserPreferencesResponse,
} from "./user-preferences-types";

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

export function patchUserPreferencesCache(patch: Partial<UserPreferencesResponse>): void {
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

export function readCachedUserPreferencesForMutators(): UserPreferencesResponse {
  return readCachedUserPreferences();
}
