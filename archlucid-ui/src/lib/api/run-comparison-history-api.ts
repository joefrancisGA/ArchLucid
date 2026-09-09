import type { components } from "@/lib/openapi-schemas";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type RunComparisonHistoryResponse = components["schemas"]["ComparisonHistoryResponse"];

/** Lists persisted comparison audit rows for a run. */
export async function getRunComparisonHistory(runId: string): Promise<RunComparisonHistoryResponse> {
  return apiGetSealedManifestAware<RunComparisonHistoryResponse>(
    `/v1/architecture/run/${encodeURIComponent(runId)}/comparisons`,
  );
}
