import type { PreFinalizeChecklistResult } from "@/types/pre-finalize-checklist";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { preFinalizeChecklistBlockedReason } from "@/lib/runs/pre-finalize-checklist-blocked-reason";

import { apiGet } from "./http";

export async function getPreFinalizeChecklist(runId: string): Promise<PreFinalizeChecklistResult> {
  try {
    return await apiGet<PreFinalizeChecklistResult>(
      `/v1/governance/pre-finalize/checklist/${encodeURIComponent(runId)}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = preFinalizeChecklistBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
