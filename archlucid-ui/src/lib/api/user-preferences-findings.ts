import * as httpApi from "@/lib/api/http";

import { patchUserPreferencesCache } from "./user-preferences-cache";
import type {
  FindingsVisibilityPreferences,
  SetFindingsVisibilityPreferencesRequest,
} from "./user-preferences-types";

export async function setUserFindingsVisibilityPreferences(
  preferences: FindingsVisibilityPreferences,
): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/findings-visibility",
    {
      hideGenericEnabled: preferences.hideGenericEnabled,
      showLowConfidenceEnabled: preferences.showLowConfidenceEnabled,
      showAdvisoryEnabled: preferences.showAdvisoryEnabled,
    } satisfies SetFindingsVisibilityPreferencesRequest,
  );

  patchUserPreferencesCache({
    findingsHideGenericEnabled: preferences.hideGenericEnabled,
    findingsHideGenericEnabledIsExplicit: true,
    findingsShowLowConfidenceEnabled: preferences.showLowConfidenceEnabled,
    findingsShowLowConfidenceEnabledIsExplicit: true,
    findingsShowAdvisoryEnabled: preferences.showAdvisoryEnabled,
    findingsShowAdvisoryEnabledIsExplicit: true,
  });
}
