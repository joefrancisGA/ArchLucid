import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { preFinalizeSyntheticSimulationBlockedReason } from "@/lib/runs/pre-finalize-synthetic-simulation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { trimRequiredText, trimTextFields } from "./api-boundary-normalization";
import { apiPostJson } from "./http";
import type { components } from "@/lib/openapi-schemas";

export type PreCommitSyntheticSimulationRequest =
  components["schemas"]["PreCommitSyntheticSimulationRequest"];

export type PreCommitGateResult = components["schemas"]["PreCommitGateResult"];

function normalizePreCommitSyntheticSimulationRequest(
  body: PreCommitSyntheticSimulationRequest,
): PreCommitSyntheticSimulationRequest {
  const normalized = trimTextFields(body, ["runId"]);
  const runId = trimRequiredText(normalized.runId, "runId");

  if (body.syntheticCount === undefined) {
    return { ...normalized, runId };
  }

  const syntheticCount = Math.floor(body.syntheticCount);

  if (!Number.isFinite(body.syntheticCount) || syntheticCount < 0) {
    throw new Error("syntheticCount must be a non-negative integer.");
  }

  return { ...normalized, runId, syntheticCount };
}

export async function simulatePreCommitSyntheticFindings(
  body: PreCommitSyntheticSimulationRequest,
): Promise<PreCommitGateResult> {
  const normalizedBody = normalizePreCommitSyntheticSimulationRequest(body);

  try {
    return await apiPostJson<PreCommitGateResult>("/v1/governance/pre-finalize/simulate", normalizedBody);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = preFinalizeSyntheticSimulationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

}
