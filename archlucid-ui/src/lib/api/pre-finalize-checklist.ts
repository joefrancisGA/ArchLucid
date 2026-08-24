import type { PreFinalizeChecklistResult } from "@/types/pre-finalize-checklist";

import { apiGet } from "./http";

export async function getPreFinalizeChecklist(runId: string): Promise<PreFinalizeChecklistResult> {
  return apiGet<PreFinalizeChecklistResult>(
    `/v1/governance/pre-finalize/checklist/${encodeURIComponent(runId)}`,
  );
}
