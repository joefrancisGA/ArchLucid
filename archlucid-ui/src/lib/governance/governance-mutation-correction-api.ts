import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { governanceMutationCorrectionBlockedReason } from "@/lib/governance/governance-mutation-correction-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiPostJson } from "@/lib/api/http";

export type GovernanceMutationCorrectionTarget = {
  readonly mutationKind: string;
  readonly subjectId: string;
  readonly runId: string;
};

export type GovernanceMutationCorrectionRecorded = {
  readonly correctionId: string;
  readonly mutationKind: string;
  readonly subjectId: string;
  readonly runId: string;
  readonly rationale: string;
  readonly recordedAtUtc: string;
  readonly recordedByUserId: string;
};

/** Records an append-only governance mutation correction on the audit trail (LI-05). */
export async function recordGovernanceMutationCorrection(
  body: GovernanceMutationCorrectionTarget & { rationale: string },
): Promise<GovernanceMutationCorrectionRecorded> {
  try {
    return await apiPostJson<GovernanceMutationCorrectionRecorded>("/v1/governance/mutation-corrections", {
      mutationKind: body.mutationKind,
      subjectId: body.subjectId,
      runId: body.runId,
      rationale: body.rationale,
    });
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceMutationCorrectionBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export const GOVERNANCE_MUTATION_CORRECTION_RATIONALE_REQUIRED =
  "Enter a rationale before recording a correction.";

export const GOVERNANCE_MUTATION_CORRECTION_SUCCESS_MESSAGE = "Correction recorded on the audit trail.";

export const GOVERNANCE_MUTATION_CORRECTION_FAILURE_MESSAGE = "Could not record the correction. Try again.";
