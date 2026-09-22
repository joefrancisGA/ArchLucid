import type {
  LivelihoodPendingMutation,
  LivelihoodPendingMutationKind,
  PolicyPackSavePendingPayload,
} from "@/lib/auth/livelihood-mutation-401-resume-kinds";

/** Kinds whose replay path sends the stored idempotency key to the API (LW-063). */
const IDEMPOTENCY_KEY_REPLAY_KINDS: ReadonlySet<LivelihoodPendingMutationKind> = new Set([
  "finding_disposition",
  "governance_mutation_correction",
  "finding_bulk_disposition",
  "architecture_review_finalize",
]);

export function livelihoodReplayUsesStoredIdempotencyKey(kind: LivelihoodPendingMutationKind): boolean {
  return IDEMPOTENCY_KEY_REPLAY_KINDS.has(kind);
}

/**
 * Silent auto-replay is safe only when the API honors the stored idempotency key (LW-063 / LW-065).
 * Kinds without server idempotency require explicit confirm when the request may have reached the server.
 */
export function requiresConfirmBeforeLivelihoodReplay(pending: LivelihoodPendingMutation): boolean {
  if (pending.kind === "policy_pack_save") {
    const payload = pending.payload as PolicyPackSavePendingPayload;

    return payload.autoReplay !== true;
  }

  if (!pending.requestLeftClient) {
    return false;
  }

  return !livelihoodReplayUsesStoredIdempotencyKey(pending.kind);
}
