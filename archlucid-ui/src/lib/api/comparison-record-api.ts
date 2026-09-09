import type { components } from "@/lib/openapi-schemas";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type ComparisonRecordResponse = components["schemas"]["ComparisonRecordResponse"];
export type ComparisonSummaryResponse = components["schemas"]["ComparisonSummaryResponse"];

/** Loads one persisted comparison audit row. */
export async function getComparisonRecord(comparisonRecordId: string): Promise<ComparisonRecordResponse> {
  return apiGetSealedManifestAware<ComparisonRecordResponse>(
    `/v1/architecture/comparisons/${encodeURIComponent(comparisonRecordId)}`,
  );
}

/** Loads the markdown summary for a persisted comparison record. */
export async function getComparisonSummary(comparisonRecordId: string): Promise<ComparisonSummaryResponse> {
  return apiGetSealedManifestAware<ComparisonSummaryResponse>(
    `/v1/architecture/comparisons/${encodeURIComponent(comparisonRecordId)}/summary`,
  );
}
