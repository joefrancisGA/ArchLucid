"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ARCHLUCID_REVIEWS_NEW_WIZARD_CONTINUE_EVENT,
  consumeReviewsNewWizardAutoRestore,
} from "@/lib/reviews-new-wizard-session-resume";
import {
  clearWizardSessionSnapshot,
  readWizardSessionSnapshot,
  writeWizardSessionSnapshot,
  type WizardSessionId,
  type WizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";
import {
  fetchWizardIntakeDraft,
  upsertWizardIntakeDraft,
} from "@/lib/api/wizard-intake-draft-api";
import { getOrCreateWizardIdempotencyKey } from "@/lib/wizard-idempotency-key";

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

    void (async () => {
      const localSnapshot = readWizardSessionSnapshot<TState>(args.wizardId);
      const remoteDraft = await fetchWizardIntakeDraft(args.wizardId);

      let remoteSnapshot: WizardSessionSnapshot<TState> | null = null;

      if (remoteDraft) {
        try {
          remoteSnapshot = {
            v: 1,
            stepIndex: remoteDraft.stepIndex,
            state: JSON.parse(remoteDraft.stateJson) as TState,
            savedAtUtc: remoteDraft.updatedUtc,
          } satisfies WizardSessionSnapshot<TState>;
        } catch {
          remoteSnapshot = null;
        }
      }

      const snapshot = localSnapshot ?? remoteSnapshot;

      if (snapshot === null || !args.hasSaveableContent(snapshot.state, snapshot.stepIndex)) {
        return;
      }

      restoreDecisionPendingRef.current = true;
      setPendingRestore(snapshot);
    })();
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

  const acceptRestoreRef = useRef(acceptRestore);

  acceptRestoreRef.current = acceptRestore;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onContinueRequested = (event: Event) => {
      const detail = (event as CustomEvent<{ wizardId: WizardSessionId }>).detail;

      if (detail?.wizardId !== args.wizardId) {
        return;
      }

      if (!consumeReviewsNewWizardAutoRestore(args.wizardId)) {
        return;
      }

      acceptRestoreRef.current();
    };

    window.addEventListener(ARCHLUCID_REVIEWS_NEW_WIZARD_CONTINUE_EVENT, onContinueRequested);

    return () => {
      window.removeEventListener(ARCHLUCID_REVIEWS_NEW_WIZARD_CONTINUE_EVENT, onContinueRequested);
    };
  }, [args.wizardId, enabled]);

  useEffect(() => {
    if (pendingRestore === null) {
      return;
    }

    if (!consumeReviewsNewWizardAutoRestore(args.wizardId)) {
      return;
    }

    acceptRestore();
  }, [acceptRestore, args.wizardId, pendingRestore]);

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

      void upsertWizardIntakeDraft(args.wizardId, {
        stepIndex: args.stepIndex,
        stateJson: serialized,
        idempotencyKey: getOrCreateWizardIdempotencyKey(),
      }).catch(() => {
        // sessionStorage remains the local fallback when tenant draft sync fails
      });
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
