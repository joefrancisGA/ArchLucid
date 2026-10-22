import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import type { ActorSet } from "@/types/draft-intake";

/** ADR 0071 — bounded document undo depth for unsealed draft editing. */
export const ARCHITECTURE_DRAFT_DOCUMENT_UNDO_STACK_DEPTH = 50;

/** Coalesce keystrokes before pushing an undo snapshot (~500ms per LK-02). */
export const ARCHITECTURE_DRAFT_DOCUMENT_UNDO_COALESCE_MS = 500;

export type ArchitectureDraftDocumentSnapshot = {
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
};

export type DraftDocumentUndoStacks = {
  readonly undo: readonly ArchitectureDraftDocumentSnapshot[];
  readonly redo: readonly ArchitectureDraftDocumentSnapshot[];
};

export function cloneDraftDocumentSnapshot(
  snapshot: ArchitectureDraftDocumentSnapshot,
): ArchitectureDraftDocumentSnapshot {
  return {
    fields: JSON.parse(JSON.stringify(snapshot.fields)) as ArchitectureDraftFieldState,
    actorSet: JSON.parse(JSON.stringify(snapshot.actorSet)) as ActorSet,
  };
}

export function draftDocumentSnapshotsEqual(
  left: ArchitectureDraftDocumentSnapshot,
  right: ArchitectureDraftDocumentSnapshot,
): boolean {
  return (
    JSON.stringify(left.fields) === JSON.stringify(right.fields) &&
    JSON.stringify(left.actorSet) === JSON.stringify(right.actorSet)
  );
}

export function pushDraftDocumentUndoSnapshot(
  stacks: DraftDocumentUndoStacks,
  snapshot: ArchitectureDraftDocumentSnapshot,
  maxDepth: number = ARCHITECTURE_DRAFT_DOCUMENT_UNDO_STACK_DEPTH,
): DraftDocumentUndoStacks {
  const top = stacks.undo[stacks.undo.length - 1];

  if (top !== undefined && draftDocumentSnapshotsEqual(top, snapshot)) {
    return stacks;
  }

  const undo = [...stacks.undo, cloneDraftDocumentSnapshot(snapshot)];

  if (undo.length > maxDepth) {
    undo.shift();
  }

  return { undo, redo: [] };
}

export function undoDraftDocumentSnapshot(
  stacks: DraftDocumentUndoStacks,
  current: ArchitectureDraftDocumentSnapshot,
): { stacks: DraftDocumentUndoStacks; restored: ArchitectureDraftDocumentSnapshot | null } {
  if (stacks.undo.length === 0) {
    return { stacks, restored: null };
  }

  const undo = [...stacks.undo];
  const restored = undo.pop()!;

  const redo = [...stacks.redo, cloneDraftDocumentSnapshot(current)];

  return { stacks: { undo, redo }, restored };
}

export function redoDraftDocumentSnapshot(
  stacks: DraftDocumentUndoStacks,
  current: ArchitectureDraftDocumentSnapshot,
): { stacks: DraftDocumentUndoStacks; restored: ArchitectureDraftDocumentSnapshot | null } {
  if (stacks.redo.length === 0) {
    return { stacks, restored: null };
  }

  const redo = [...stacks.redo];
  const restored = redo.pop()!;

  const undo = [...stacks.undo, cloneDraftDocumentSnapshot(current)];

  return { stacks: { undo, redo }, restored };
}
