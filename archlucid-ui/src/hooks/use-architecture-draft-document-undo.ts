"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import {
  ARCHITECTURE_DRAFT_DOCUMENT_UNDO_COALESCE_MS,
  cloneDraftDocumentSnapshot,
  draftDocumentSnapshotsEqual,
  pushDraftDocumentUndoSnapshot,
  redoDraftDocumentSnapshot,
  undoDraftDocumentSnapshot,
  type ArchitectureDraftDocumentSnapshot,
  type DraftDocumentUndoStacks,
} from "@/lib/architecture/architecture-draft-document-undo";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { ActorSet } from "@/types/draft-intake";

export type UseArchitectureDraftDocumentUndoArgs = {
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly setFields: Dispatch<SetStateAction<ArchitectureDraftFieldState>>;
  readonly setActorSet: Dispatch<SetStateAction<ActorSet>>;
  /** False when spawn-locked, brief frozen, or exit pending. */
  readonly enabled: boolean;
  readonly markDirty?: () => void;
};

export type UseArchitectureDraftDocumentUndoResult = {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undo: () => boolean;
  readonly redo: () => boolean;
  /** Clear stacks after server hydrate / baseline accept. */
  readonly resetStacks: (baseline: ArchitectureDraftDocumentSnapshot) => void;
};

const EMPTY_STACKS: DraftDocumentUndoStacks = { undo: [], redo: [] };

export function useArchitectureDraftDocumentUndo(
  args: UseArchitectureDraftDocumentUndoArgs,
): UseArchitectureDraftDocumentUndoResult {
  const [stacks, setStacks] = useState<DraftDocumentUndoStacks>(EMPTY_STACKS);
  const isRestoringRef = useRef(false);
  const coalesceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRecordedRef = useRef<ArchitectureDraftDocumentSnapshot | null>(null);

  const currentSnapshot: ArchitectureDraftDocumentSnapshot = {
    fields: args.fields,
    actorSet: args.actorSet,
  };

  const resetStacks = useCallback((baseline: ArchitectureDraftDocumentSnapshot) => {
    lastRecordedRef.current = cloneDraftDocumentSnapshot(baseline);
    setStacks(EMPTY_STACKS);
  }, []);

  useEffect(() => {
    if (!args.enabled) {
      return;
    }

    if (isRestoringRef.current) {
      isRestoringRef.current = false;

      return;
    }

    if (lastRecordedRef.current === null) {
      lastRecordedRef.current = cloneDraftDocumentSnapshot(currentSnapshot);

      return;
    }

    if (draftDocumentSnapshotsEqual(lastRecordedRef.current, currentSnapshot)) {
      return;
    }

    if (coalesceTimerRef.current !== null) {
      clearTimeout(coalesceTimerRef.current);
    }

    coalesceTimerRef.current = setTimeout(() => {
      const snapshotToPush = lastRecordedRef.current;

      if (snapshotToPush === null) {
        return;
      }

      lastRecordedRef.current = cloneDraftDocumentSnapshot(currentSnapshot);
      setStacks((previous) => pushDraftDocumentUndoSnapshot(previous, snapshotToPush));
    }, ARCHITECTURE_DRAFT_DOCUMENT_UNDO_COALESCE_MS);

    return () => {
      if (coalesceTimerRef.current !== null) {
        clearTimeout(coalesceTimerRef.current);
      }
    };
  }, [args.enabled, currentSnapshot, args.fields, args.actorSet]);

  const applyRestoredSnapshot = useCallback(
    (restored: ArchitectureDraftDocumentSnapshot) => {
      isRestoringRef.current = true;
      args.setFields(restored.fields);
      args.setActorSet(restored.actorSet);
      lastRecordedRef.current = cloneDraftDocumentSnapshot(restored);
      args.markDirty?.();
    },
    [args],
  );

  const undo = useCallback((): boolean => {
    if (!args.enabled) {
      return false;
    }

    const { stacks: nextStacks, restored } = undoDraftDocumentSnapshot(stacks, currentSnapshot);

    if (restored === null) {
      return false;
    }

    setStacks(nextStacks);
    applyRestoredSnapshot(restored);

    return true;
  }, [applyRestoredSnapshot, args.enabled, currentSnapshot, stacks]);

  const redo = useCallback((): boolean => {
    if (!args.enabled) {
      return false;
    }

    const { stacks: nextStacks, restored } = redoDraftDocumentSnapshot(stacks, currentSnapshot);

    if (restored === null) {
      return false;
    }

    setStacks(nextStacks);
    applyRestoredSnapshot(restored);

    return true;
  }, [applyRestoredSnapshot, args.enabled, currentSnapshot, stacks]);

  useKeyboardShortcuts({
    "ctrl+z": {
      description: "Undo draft edit",
      allowInInput: true,
      handler: undo,
    },
    "ctrl+shift+z": {
      description: "Redo draft edit",
      allowInInput: true,
      handler: redo,
    },
  });

  return {
    canUndo: args.enabled && stacks.undo.length > 0,
    canRedo: args.enabled && stacks.redo.length > 0,
    undo,
    redo,
    resetStacks,
  };
}
