import * as httpApi from "@/lib/api/http";
import { recordFirstSessionPurposeChosen } from "@/lib/live-seat-funnel-telemetry";

import { patchUserPreferencesCache } from "./user-preferences-cache";
import type { FirstSessionPurposeId, SetFirstSessionPurposeRequest } from "./user-preferences-types";

export async function setUserFirstSessionPurpose(purpose: FirstSessionPurposeId): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/first-session-purpose",
    { purpose } satisfies SetFirstSessionPurposeRequest,
  );

  patchUserPreferencesCache({
    firstSessionPurpose: purpose,
    firstSessionPurposeIsExplicit: true,
  });
  recordFirstSessionPurposeChosen(purpose);
}
