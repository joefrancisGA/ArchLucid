import type { components } from "@/lib/api-types.generated";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { comparisonReplayCostBlockedReason } from "@/lib/compare/comparison-replay-cost-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGet } from "./http";

export type ComparisonReplayCostEstimateResponse = components["schemas"]["ComparisonReplayCostEstimateResponse"];

/** Cost estimate surfaced before initiating architecture comparison replay (warn-only UX). */
export async function fetchArchitectureComparisonReplayCostEstimate(
  comparisonRecordId: string,
  query?: Readonly<{ replayMode?: string; format?: string; persistReplay?: boolean }>,
): Promise<ComparisonReplayCostEstimateResponse> {
  const id = comparisonRecordId.trim();

  if (id.length === 0) {
    throw new Error("comparisonRecordId is required.");
  }

  const qp = new URLSearchParams();

  if (query?.replayMode != null && query.replayMode.trim().length > 0) {
    qp.set("replayMode", query.replayMode.trim());
  }

  if (query?.format != null && query.format.trim().length > 0) {
    qp.set("format", query.format.trim());
  }

  if (query?.persistReplay === true || query?.persistReplay === false) {
    qp.set("persistReplay", String(query.persistReplay));
  }

  const suffix = qp.toString().length > 0 ? `?${qp}` : "";

  try {
    return await apiGet<ComparisonReplayCostEstimateResponse>(
      `/v1/architecture/comparisons/${encodeURIComponent(id)}/replay/cost-estimate${suffix}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = comparisonReplayCostBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
