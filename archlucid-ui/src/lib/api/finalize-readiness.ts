import type { FinalizeReadinessResult } from "@/types/finalize-readiness";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { preFinalizeChecklistBlockedReason } from "@/lib/runs/pre-finalize-checklist-blocked-reason";

import { apiGet } from "./http";

export async function getFinalizeReadiness(
  runId: string,
  acknowledgedAssumptionIds?: readonly string[],
): Promise<FinalizeReadinessResult> {
  const params = new URLSearchParams();

  if (acknowledgedAssumptionIds !== undefined) {
    for (const assumptionId of acknowledgedAssumptionIds) {
      if (assumptionId.trim().length > 0) {
        params.append("acknowledgedAssumptionIds", assumptionId.trim());
      }
    }
  }

  const query = params.toString();
  const path =
    `/v1/governance/pre-finalize/readiness/${encodeURIComponent(runId)}`
    + (query.length > 0 ? `?${query}` : "");

  try {
    return await apiGet<FinalizeReadinessResult>(path);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = preFinalizeChecklistBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
