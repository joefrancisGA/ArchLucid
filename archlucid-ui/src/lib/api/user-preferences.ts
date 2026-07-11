import { apiGet, apiPutJson } from "@/lib/api/http";
import type { ColorModePreference } from "@/lib/color-mode-preference";

export type UserPreferencesResponse = {
  appearancePreference: ColorModePreference;
  appearancePreferenceIsExplicit: boolean;
};

export type SetAppearancePreferenceRequest = {
  value: ColorModePreference;
};

export async function getUserPreferences(): Promise<UserPreferencesResponse> {
  return apiGet<UserPreferencesResponse>("/v1/user/preferences");
}

export async function setUserAppearancePreference(value: ColorModePreference): Promise<void> {
  await apiPutJson<void>("/v1/user/preferences/appearance", { value } satisfies SetAppearancePreferenceRequest);
}
