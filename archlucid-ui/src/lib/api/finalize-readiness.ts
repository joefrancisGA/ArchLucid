import type { FinalizeReadinessResult } from "@/types/finalize-readiness";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { preFinalizeChecklistBlockedReason } from "@/lib/runs/pre-finalize-checklist-blocked-reason";

import { encodeRequiredPathSegment, trimStringList } from "./api-boundary-normalization";
import { apiGet } from "./http";

export async function getFinalizeReadiness(
  runId: string,
  acknowledgedAssumptionIds?: readonly string[],
): Promise<FinalizeReadinessResult> {
  const params = new URLSearchParams();

  trimStringList(acknowledgedAssumptionIds)
    .forEach((assumptionId) => params.append("acknowledgedAssumptionIds", assumptionId));

  const query = params.toString();
  const path =
    `/v1/governance/pre-finalize/readiness/${encodeRequiredPathSegment(runId, "runId")}`
    + (query.length > 0 ? `?${query}` : "");

  try {
    return await apiGet<FinalizeReadinessResult>(path);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = preFinalizeChecklistBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
