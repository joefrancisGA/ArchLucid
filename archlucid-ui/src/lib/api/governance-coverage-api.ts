import type { components } from "@/lib/openapi-schemas";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { ApiV1Routes } from "@/lib/api-v1-routes";

export type CoverageSummaryResponse = components["schemas"]["CoverageSummaryResponse"];

/** GET /v1/governance/coverage — scope coverage disclosure for the active tenant/workspace/project. */
export async function getGovernanceScopeCoverage(): Promise<CoverageSummaryResponse> {
  return apiGetSealedManifestAware<CoverageSummaryResponse>(`/${ApiV1Routes.governance}/coverage`);
}
