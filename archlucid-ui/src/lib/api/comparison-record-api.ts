import type { components } from "@/lib/openapi-schemas";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type ComparisonRecordResponse = components["schemas"]["ComparisonRecordResponse"];
export type ComparisonSummaryResponse = components["schemas"]["ComparisonSummaryResponse"];
export type ComparisonHistoryResponse = components["schemas"]["ComparisonHistoryResponse"];

export type ComparisonSearchQuery = {
  readonly comparisonType?: string;
  readonly leftRunId?: string;
  readonly rightRunId?: string;
  readonly leftExportRecordId?: string;
  readonly rightExportRecordId?: string;
  readonly label?: string;
  readonly cursor?: string;
  readonly pageSize?: number;
};

/** Searches persisted comparison audit rows with optional run/export filters. */
export async function searchComparisonRecords(
  query: ComparisonSearchQuery = {},
): Promise<ComparisonHistoryResponse> {
  const params = new URLSearchParams();

  if (query.comparisonType) params.set("comparisonType", query.comparisonType);
  if (query.leftRunId) params.set("leftRunId", query.leftRunId);
  if (query.rightRunId) params.set("rightRunId", query.rightRunId);
  if (query.leftExportRecordId) params.set("leftExportRecordId", query.leftExportRecordId);
  if (query.rightExportRecordId) params.set("rightExportRecordId", query.rightExportRecordId);
  if (query.label) params.set("label", query.label);
  if (query.cursor) params.set("cursor", query.cursor);
  if (typeof query.pageSize === "number") params.set("pageSize", String(query.pageSize));

  const suffix = params.size > 0 ? `?${params.toString()}` : "";

  return apiGetSealedManifestAware<ComparisonHistoryResponse>(`/v1/architecture/comparisons${suffix}`);
}

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
