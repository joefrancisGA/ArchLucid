import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { preFinalizeSyntheticSimulationBlockedReason } from "@/lib/runs/pre-finalize-synthetic-simulation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiPostJson } from "./http";
import type { components } from "@/lib/openapi-schemas";

export type PreCommitSyntheticSimulationRequest =
  components["schemas"]["PreCommitSyntheticSimulationRequest"];

export type PreCommitGateResult = components["schemas"]["PreCommitGateResult"];

export async function simulatePreCommitSyntheticFindings(
  body: PreCommitSyntheticSimulationRequest,
): Promise<PreCommitGateResult> {
  try {
    return await apiPostJson<PreCommitGateResult>("/v1/governance/pre-finalize/simulate", body);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = preFinalizeSyntheticSimulationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

}
