import type { PreFinalizeChecklistResult } from "@/types/pre-finalize-checklist";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export async function getPreFinalizeChecklist(runId: string): Promise<PreFinalizeChecklistResult> {
  return apiGetSealedManifestAware<PreFinalizeChecklistResult>(
    `/v1/governance/pre-finalize/checklist/${encodeURIComponent(runId)}`,
  );
}
