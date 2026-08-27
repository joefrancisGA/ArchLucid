"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchUserPreferencesFromApi,
  USER_PREFERENCES_STALE_MS,
  type UserPreferencesResponse,
} from "@/lib/api/user-preferences";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export type UserPreferencesExplicitFlags = {
  readonly appearanceIsExplicit: boolean;
  readonly cloudPlatformScopeIsExplicit: boolean;
  readonly ianaTimeZoneIsExplicit: boolean;
  readonly whereToGoNextIsExplicit: boolean;
  readonly sampleReviewsOnOverviewIsExplicit: boolean;
  readonly loaded: boolean;
};

function resolveExplicitFlags(data: UserPreferencesResponse | undefined): UserPreferencesExplicitFlags {
  return {
    appearanceIsExplicit: data?.appearancePreferenceIsExplicit ?? false,
    cloudPlatformScopeIsExplicit: data?.cloudPlatformScopeIsExplicit ?? false,
    ianaTimeZoneIsExplicit: data?.ianaTimeZoneIsExplicit ?? false,
    whereToGoNextIsExplicit: data?.whereToGoNextIsExplicit ?? false,
    sampleReviewsOnOverviewIsExplicit: data?.sampleReviewsOnOverviewIsExplicit ?? false,
    loaded: data !== undefined,
  };
}

export function useUserPreferencesExplicitFlags(): UserPreferencesExplicitFlags {
  const query = useQuery({
    queryKey: operatorQueryKeys.userPreferences,
    queryFn: fetchUserPreferencesFromApi,
    staleTime: USER_PREFERENCES_STALE_MS,
  });

  return resolveExplicitFlags(query.data);
}
