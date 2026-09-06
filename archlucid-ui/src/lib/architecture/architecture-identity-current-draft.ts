import type { ArchitectureIdentityChildDraftSummary } from "@/types/architecture-identity";
import type { DraftRequestStatus } from "@/types/draft-intake";

export type ArchitectureIdentityCurrentDraftState =
  | {
      readonly kind: "drafting";
      readonly draftId: string;
    }
  | {
      readonly kind: "spawn-locked";
      readonly draftId: string;
      readonly linkedReviewId: string | null;
    }
  | {
      readonly kind: "none";
      readonly cloneSourceDraftId: string | null;
    };

function isDraftingStatus(status: DraftRequestStatus): boolean {
  return status === "Drafting";
}

function isSpawnLockedStatus(status: DraftRequestStatus): boolean {
  return status === "RunSpawned";
}

/** Prefer an editable drafting child; otherwise surface spawn-locked handoff state (CA-28). */
export function resolveArchitectureIdentityCurrentDraftState(
  drafts: readonly ArchitectureIdentityChildDraftSummary[],
  currentDraftId: string | null | undefined,
  latestReviewId: string | null | undefined,
): ArchitectureIdentityCurrentDraftState {
  const sortedDrafts = [...drafts].sort((left, right) => right.updatedUtc.localeCompare(left.updatedUtc));
  const draftingDraft = sortedDrafts.find((draft) => isDraftingStatus(draft.status));

  if (draftingDraft !== undefined) {
    return { kind: "drafting", draftId: draftingDraft.draftId };
  }

  const normalizedCurrentDraftId = currentDraftId?.trim() ?? "";
  const currentDraft =
    normalizedCurrentDraftId.length > 0
      ? sortedDrafts.find((draft) => draft.draftId === normalizedCurrentDraftId)
      : undefined;
  const spawnLockedDraft =
    currentDraft !== undefined && isSpawnLockedStatus(currentDraft.status)
      ? currentDraft
      : sortedDrafts.find((draft) => isSpawnLockedStatus(draft.status));

  if (spawnLockedDraft !== undefined) {
    const linkedReviewId = latestReviewId?.trim() ?? "";

    return {
      kind: "spawn-locked",
      draftId: spawnLockedDraft.draftId,
      linkedReviewId: linkedReviewId.length > 0 ? linkedReviewId : null,
    };
  }

  const cloneSourceDraft = sortedDrafts.find((draft) => isSpawnLockedStatus(draft.status)) ?? null;

  return {
    kind: "none",
    cloneSourceDraftId: cloneSourceDraft?.draftId ?? null,
  };
}
