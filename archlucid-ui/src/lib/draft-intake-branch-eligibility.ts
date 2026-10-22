import type { DraftRequestStatus } from "@/types/draft-intake";

/** Mirrors `DraftRequestStateMachine.AllowsBranch` (R12 — Admitted or RunSpawned only). */
export function draftStatusAllowsWhatIfBranch(
  status: DraftRequestStatus | null | undefined,
): boolean {
  return status === "Admitted" || status === "RunSpawned";
}
