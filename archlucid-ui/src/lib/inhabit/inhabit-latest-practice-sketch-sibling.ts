import { architectureIdentityDraftHref } from "@/lib/architecture/architecture-routes";
import { WORKING_REHEARSAL_DOOR_LABEL } from "@/lib/governance/working-career-rehearsal-door-copy";
import type { ArchitectureIdentityChildDraftSummary } from "@/types/architecture-identity";
import type { DraftRequestStatus } from "@/types/draft-intake";

export type InhabitLatestPracticeSketchSibling = {
  readonly draftId: string;
  readonly label: string;
  readonly href: string;
  readonly practiceStamp: string;
};

function isOpenSketchDraft(status: DraftRequestStatus): boolean {
  return status === "Drafting";
}

/** IH-050 — latest open Practice sketch draft sibling (not the spawn-locked parent). */
export function resolveInhabitLatestPracticeSketchSibling(input: {
  readonly architectureId: string;
  readonly drafts: readonly ArchitectureIdentityChildDraftSummary[];
  readonly currentDraftId?: string | null;
  readonly scopedRunId?: string | null;
}): InhabitLatestPracticeSketchSibling | null {
  const architectureId = input.architectureId.trim();

  if (architectureId.length === 0) {
    return null;
  }

  const sortedDrafts = [...input.drafts].sort((left, right) =>
    right.updatedUtc.localeCompare(left.updatedUtc),
  );
  const spawnLockedDraftId = input.currentDraftId?.trim() ?? "";
  const sketchDraft = sortedDrafts.find((draft) => {
    if (!isOpenSketchDraft(draft.status)) {
      return false;
    }

    if (spawnLockedDraftId.length > 0 && draft.draftId === spawnLockedDraftId) {
      return false;
    }

    return true;
  });

  if (sketchDraft === undefined) {
    return null;
  }

  const displayName = sketchDraft.systemName?.trim() || "Practice sketch";

  return {
    draftId: sketchDraft.draftId,
    label: displayName,
    href: architectureIdentityDraftHref(architectureId, sketchDraft.draftId),
    practiceStamp: WORKING_REHEARSAL_DOOR_LABEL,
  };
}
