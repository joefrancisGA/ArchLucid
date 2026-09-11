import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "./export-sealed-manifest-conflict";
import { apiGet } from "./http";
import { governanceScopeCoverageBlockedReason } from "@/lib/governance/governance-coverage-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { ApiV1Routes } from "@/lib/api-v1-routes";

export type CoverageSummaryResponse = components["schemas"]["CoverageSummaryResponse"];

/** GET /v1/governance/coverage — scope coverage disclosure for the active tenant/workspace/project. */
export async function getGovernanceScopeCoverage(): Promise<CoverageSummaryResponse> {
  try {
    return await apiGet<CoverageSummaryResponse>(`/${ApiV1Routes.governance}/coverage`);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceScopeCoverageBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
