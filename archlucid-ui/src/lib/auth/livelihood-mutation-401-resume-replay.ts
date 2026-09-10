import { recordFindingDisposition } from "@/lib/api/governance-stickiness-api";
import {
  type LivelihoodPendingMutation,
  type FindingDispositionPendingPayload,
  type GovernanceMutationCorrectionPendingPayload,
} from "@/lib/auth/livelihood-mutation-401-resume";
import { recordGovernanceMutationCorrection } from "@/lib/governance/governance-mutation-correction-api";

/** Replays one stored livelihood mutation with the same idempotency key (ADR 0076). */
export async function replayLivelihoodPendingMutation(
  pending: LivelihoodPendingMutation,
): Promise<unknown> {
  switch (pending.kind) {
    case "finding_disposition": {
      const payload = pending.payload as FindingDispositionPendingPayload;

      return recordFindingDisposition(payload.findingId, payload.body, {
        idempotencyKey: pending.idempotencyKey,
      });
    }

    case "governance_mutation_correction": {
      const payload = pending.payload as GovernanceMutationCorrectionPendingPayload;

      return recordGovernanceMutationCorrection(payload.body, {
        idempotencyKey: pending.idempotencyKey,
      });
    }

    default: {
      const exhaustiveKind: never = pending.kind;
      throw new Error(`Unsupported livelihood pending mutation kind: ${exhaustiveKind}`);
    }
  }
}
