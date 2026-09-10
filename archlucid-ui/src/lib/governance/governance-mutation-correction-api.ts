import { executeIdempotentLivelihoodMutation } from "@/lib/auth/livelihood-mutation-401-resume";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
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
  options?: { readonly idempotencyKey?: string },
): Promise<GovernanceMutationCorrectionRecorded> {
  const idempotencyKey = options?.idempotencyKey?.trim() || createGovernanceMutationIdempotencyKey();
  const headers = { "Idempotency-Key": idempotencyKey };

  return apiPostJson<GovernanceMutationCorrectionRecorded>(
    "/v1/governance/mutation-corrections",
    {
      mutationKind: body.mutationKind,
      subjectId: body.subjectId,
      runId: body.runId,
      rationale: body.rationale,
    },
    { extraHeaders: headers },
  );
}

/** Record-correction POST with 401 session-recovery redirect and single idempotent replay (LP-19). */
export async function recordGovernanceMutationCorrectionWith401Resume(
  body: GovernanceMutationCorrectionTarget & { rationale: string },
  options: { readonly idempotencyKey: string; readonly returnPath: string },
): Promise<GovernanceMutationCorrectionRecorded> {
  const idempotencyKey = options.idempotencyKey.trim();

  return executeIdempotentLivelihoodMutation({
    kind: "governance_mutation_correction",
    returnPath: options.returnPath,
    idempotencyKey,
    payload: { body },
    execute: () => recordGovernanceMutationCorrection(body, { idempotencyKey }),
  });
}

export const GOVERNANCE_MUTATION_CORRECTION_RATIONALE_REQUIRED =
  "Enter a rationale before recording a correction.";

export const GOVERNANCE_MUTATION_CORRECTION_SUCCESS_MESSAGE = "Correction recorded on the audit trail.";

export const GOVERNANCE_MUTATION_CORRECTION_FAILURE_MESSAGE = "Could not record the correction. Try again.";
