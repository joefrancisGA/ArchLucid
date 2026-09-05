"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import type { ScopeUnderstandingBullet } from "@/lib/architecture/architecture-scope-understanding-check";
import type { ActorSet } from "@/types/draft-intake";

import {
  type ArchitectureDraftSaveState,
  type UseArchitectureDraftAutosaveArgs,
  type UseArchitectureDraftAutosaveResult,
} from "@/hooks/architecture-draft-autosave-shared";
import { useArchitectureDraftAutosaveHydrate } from "@/hooks/use-architecture-draft-autosave-hydrate";
import { useArchitectureDraftAutosavePersist } from "@/hooks/use-architecture-draft-autosave-persist";
import { readArchitectureNewDraftRecovery } from "@/lib/architecture/architecture-new-draft-recovery";

export type { ArchitectureDraftSaveState } from "@/hooks/architecture-draft-autosave-shared";

/** Debounced server autosave for architecture drafts — never starts a review. */
export function useArchitectureDraftAutosave(
  args: UseArchitectureDraftAutosaveArgs,
): UseArchitectureDraftAutosaveResult {
  const enabled = args.enabled !== false;
  const deferCreateUntilFirstSave = args.deferCreateUntilFirstSave === true;
  const [saveState, setSaveState] = useState<ArchitectureDraftSaveState>("idle");
  const [lastSavedUtc, setLastSavedUtc] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [hasPersistedDraft, setHasPersistedDraft] = useState(!deferCreateUntilFirstSave);

  const fieldsRef = useRef(args.fields);
  const actorSetRef = useRef(args.actorSet);
  const scopeGateOpenRef = useRef(args.scopeGateOpen === true);
  const scopeBulletsRef = useRef<readonly ScopeUnderstandingBullet[]>(args.scopeBullets ?? []);
  const autosaveBlockedRef = useRef(false);
  const recoveryHydratedRef = useRef(false);

  fieldsRef.current = args.fields;
  actorSetRef.current = args.actorSet;
  scopeGateOpenRef.current = args.scopeGateOpen === true;
  scopeBulletsRef.current = args.scopeBullets ?? [];

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  const hydrate = useArchitectureDraftAutosaveHydrate({
    draftId: args.draftId,
    fields: args.fields,
    actorSet: args.actorSet,
    deferCreateUntilFirstSave,
    onDraftLoaded: args.onDraftLoaded,
    setSaveState,
    setLastSavedUtc,
    setConflictMessage,
    setHasPersistedDraft,
  });

  useEffect(() => {
    if (!deferCreateUntilFirstSave || recoveryHydratedRef.current) {
      return;
    }

    if (hydrate.resolvedDraftIdRef.current !== null) {
      return;
    }

    const recovery = readArchitectureNewDraftRecovery();

    if (recovery === null) {
      return;
    }

    recoveryHydratedRef.current = true;
    args.onNewDraftRecoveryHydrated?.({
      fields: recovery.fields,
      actorSet: recovery.actorSet,
    });
    setSaveState("offline");
  }, [args, deferCreateUntilFirstSave, hydrate.resolvedDraftIdRef]);

  const markDirty = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (!isOnline) {
      setSaveState("offline");

      return;
    }

    setSaveState("unsaved");
  }, [enabled, isOnline]);

  const persistDraftBundle = useArchitectureDraftAutosavePersist({
    draftId: args.draftId,
    enabled,
    deferCreateUntilFirstSave,
    scopeGateOpen: args.scopeGateOpen,
    scopeBullets: args.scopeBullets,
    onDraftCreated: args.onDraftCreated,
    onImmutableDraftDetected: args.onImmutableDraftDetected,
    fields: args.fields,
    actorSet: args.actorSet,
    hasUnsavedChanges: hydrate.hasUnsavedChanges,
    writePersistedBaseline: hydrate.writePersistedBaseline,
    setSaveState,
    setLastSavedUtc,
    setConflictMessage,
    setHasPersistedDraft,
    serverUpdatedUtcRef: hydrate.serverUpdatedUtcRef,
    fieldsRef,
    actorSetRef,
    scopeGateOpenRef,
    scopeBulletsRef,
    resolvedDraftIdRef: hydrate.resolvedDraftIdRef,
    autosaveBlockedRef,
    markDirty,
  });

  return {
    saveState,
    lastSavedUtc,
    conflictMessage,
    saveDraft: persistDraftBundle.persistDraft,
    markDirty,
    reloadDraft: hydrate.reloadDraft,
    acceptServerBaseline: hydrate.acceptServerBaseline,
    syncServerUpdatedUtc: hydrate.syncServerUpdatedUtc,
    hasPersistedDraft,
    keepLocalDraftOnConflict: persistDraftBundle.keepLocalDraftOnConflict,
  };
}
