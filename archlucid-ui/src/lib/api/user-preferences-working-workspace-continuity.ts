import * as httpApi from "@/lib/api/http";

import { patchUserPreferencesCache } from "./user-preferences-cache";
import type {
  SetWorkingWorkspaceContinuityRequest,
  WorkingWorkspaceContinuityDto,
} from "./user-preferences-types";

export async function setUserWorkingWorkspaceContinuity(
  continuity: WorkingWorkspaceContinuityDto,
): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/working-workspace-continuity",
    { continuity } satisfies SetWorkingWorkspaceContinuityRequest,
  );

  patchUserPreferencesCache({
    workingWorkspaceContinuity: continuity,
    workingWorkspaceContinuityIsExplicit: true,
  });
}
