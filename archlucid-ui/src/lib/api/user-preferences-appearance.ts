import * as httpApi from "@/lib/api/http";
import type { CloudPlatformScope } from "@/lib/cloud-platform-scope-storage";
import type { ColorModePreference } from "@/lib/color-mode-preference";

import { patchUserPreferencesCache, readCachedUserPreferencesForMutators } from "./user-preferences-cache";
import {
  toCloudPlatformScopeDto,
  type SetAppearancePreferenceRequest,
  type SetCloudPlatformScopeRequest,
  type SetIanaTimeZonePreferenceRequest,
  type SetSampleReviewsOnOverviewVisibilityRequest,
  type SetWhereToGoNextVisibilityRequest,
} from "./user-preferences-types";

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

export async function setUserSampleReviewsOnOverviewEnabled(enabled: boolean): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/sample-reviews-on-overview",
    { enabled } satisfies SetSampleReviewsOnOverviewVisibilityRequest,
  );

  patchUserPreferencesCache({
    sampleReviewsOnOverviewEnabled: enabled,
    sampleReviewsOnOverviewIsExplicit: true,
  });
}

export async function setUserIanaTimeZonePreference(ianaTimeZoneId: string): Promise<void> {
  const cached = readCachedUserPreferencesForMutators();

  if (cached.ianaTimeZoneIsExplicit && cached.ianaTimeZoneId === ianaTimeZoneId) {
    return;
  }

  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/time-zone",
    { ianaTimeZoneId } satisfies SetIanaTimeZonePreferenceRequest,
  );

  patchUserPreferencesCache({
    ianaTimeZoneId,
    ianaTimeZoneIsExplicit: true,
  });
}
