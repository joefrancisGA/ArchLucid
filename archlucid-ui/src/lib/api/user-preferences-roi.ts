import * as httpApi from "@/lib/api/http";

import { patchUserPreferencesCache } from "./user-preferences-cache";
import type { SetRoiLoadedHourlyCostUsdRequest } from "./user-preferences-types";

export async function setUserRoiLoadedHourlyCostUsd(hourlyCostUsd: number): Promise<void> {
  await httpApi.apiPutJson<void>(
    "/v1/user/preferences/roi-loaded-hourly-cost",
    { hourlyCostUsd } satisfies SetRoiLoadedHourlyCostUsdRequest,
  );

  patchUserPreferencesCache({
    roiLoadedHourlyCostUsd: hourlyCostUsd,
    roiLoadedHourlyCostUsdIsExplicit: true,
  });
}
