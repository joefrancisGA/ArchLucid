"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearWizardSessionSnapshot,
  readWizardSessionSnapshot,
  writeWizardSessionSnapshot,
  type WizardSessionId,
  type WizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";

export type WizardSessionSaveState = "idle" | "saved" | "saving" | "unsaved";

const PERSIST_DEBOUNCE_MS = 800;

type UseWizardSessionPersistenceArgs<TState> = {
  readonly wizardId: WizardSessionId;
  readonly stepIndex: number;
  readonly state: TState;
  readonly enabled?: boolean;
  readonly hasSaveableContent: (state: TState, stepIndex: number) => boolean;
  readonly onRestore: (snapshot: WizardSessionSnapshot<TState>) => void;
};

type UseWizardSessionPersistenceResult<TState> = {
  readonly saveState: WizardSessionSaveState;
  readonly lastSavedUtc: string | null;
  readonly pendingRestore: WizardSessionSnapshot<TState> | null;
  readonly acceptRestore: () => void;
  readonly dismissRestore: () => void;
  readonly clearSession: () => void;
};

/** Debounced sessionStorage persistence for multi-step operator wizards (TB-2157). */
export function useWizardSessionPersistence<TState>(
  args: UseWizardSessionPersistenceArgs<TState>,
): UseWizardSessionPersistenceResult<TState> {
  const enabled = args.enabled !== false;
  const [saveState, setSaveState] = useState<WizardSessionSaveState>("idle");
  const [lastSavedUtc, setLastSavedUtc] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<WizardSessionSnapshot<TState> | null>(null);
  const restorePromptCheckedRef = useRef(false);
  const restoreDecisionPendingRef = useRef(false);
  const persistedSnapshotRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSession = useCallback(() => {
    clearWizardSessionSnapshot(args.wizardId);
    persistedSnapshotRef.current = null;
    setLastSavedUtc(null);
    setSaveState("idle");
  }, [args.wizardId]);

  useEffect(() => {
    if (!enabled || restorePromptCheckedRef.current) {
      return;
    }

    restorePromptCheckedRef.current = true;
    const snapshot = readWizardSessionSnapshot<TState>(args.wizardId);

    if (snapshot === null || !args.hasSaveableContent(snapshot.state, snapshot.stepIndex)) {
      return;
    }

    restoreDecisionPendingRef.current = true;
    setPendingRestore(snapshot);
  }, [args.hasSaveableContent, args.wizardId, enabled]);

  const acceptRestore = useCallback(() => {
    if (pendingRestore === null) {
      return;
    }

    args.onRestore(pendingRestore);
    restoreDecisionPendingRef.current = false;
    setPendingRestore(null);
    persistedSnapshotRef.current = JSON.stringify(pendingRestore.state);
    setLastSavedUtc(pendingRestore.savedAtUtc);
    setSaveState("saved");
  }, [args, pendingRestore]);

  const dismissRestore = useCallback(() => {
    restoreDecisionPendingRef.current = false;
    setPendingRestore(null);
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    if (!enabled || restoreDecisionPendingRef.current) {
      return;
    }

    if (!args.hasSaveableContent(args.state, args.stepIndex)) {
      return;
    }

    const serialized = JSON.stringify(args.state);

    if (serialized === persistedSnapshotRef.current) {
      return;
    }

    setSaveState("unsaved");

    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setSaveState("saving");
      const savedAtUtc = writeWizardSessionSnapshot(args.wizardId, {
        stepIndex: args.stepIndex,
        state: args.state,
      });
      persistedSnapshotRef.current = serialized;
      setLastSavedUtc(savedAtUtc);
      setSaveState("saved");
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [args.enabled, args.hasSaveableContent, args.state, args.stepIndex, args.wizardId, enabled]);

  return {
    saveState,
    lastSavedUtc,
    pendingRestore,
    acceptRestore,
    dismissRestore,
    clearSession,
  };
}
