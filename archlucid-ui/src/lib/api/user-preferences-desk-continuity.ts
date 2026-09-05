import * as httpApi from "@/lib/api/http";

import { patchUserPreferencesCache } from "./user-preferences-cache";
import type { DeskContinuityDto, SetDeskContinuityRequest } from "./user-preferences-types";

export async function setUserDeskContinuity(continuity: DeskContinuityDto): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/desk-continuity",
    { continuity } satisfies SetDeskContinuityRequest,
  );

  patchUserPreferencesCache({
    deskContinuity: continuity,
    deskContinuityIsExplicit: true,
  });
}
