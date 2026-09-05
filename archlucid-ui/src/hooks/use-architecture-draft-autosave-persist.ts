"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { invalidateArchitectureDraftListQueries } from "@/lib/architecture/architecture-draft-list-client";
import {
  buildArchitectureDraftPatchPayload,
  hasArchitectureDraftSaveableContent,
  validateArchitectureDraftIntegrity,
} from "@/lib/architecture/architecture-draft-readiness";
import { actorSetFromDraftDocument } from "@/lib/architecture/architecture-creation-init";
import {
  dequeueArchitectureDraftOfflinePatch,
  enqueueArchitectureDraftOfflinePatch,
  listArchitectureDraftOfflineQueue,
} from "@/lib/architecture/architecture-draft-offline-queue";
import {
  clearArchitectureNewDraftRecovery,
  readArchitectureNewDraftRecovery,
  writeArchitectureNewDraftRecovery,
} from "@/lib/architecture/architecture-new-draft-recovery";
import { isApiRequestError } from "@/lib/api-request-error";
import { createDraftRequest, getDraftRequest, patchDraftRequest } from "@/lib/api/draft-intake-api";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import type { ActorSet } from "@/types/draft-intake";

import {
  ARCHITECTURE_DRAFT_AUTOSAVE_DEBOUNCE_MS,
  createIntentForDeferredDraft,
  fieldsFromDraftDocument,
  isNonRetryableDraftPatchError,
  type ArchitectureDraftSaveState,
  type UseArchitectureDraftAutosaveArgs,
} from "@/hooks/architecture-draft-autosave-shared";

type UseArchitectureDraftAutosavePersistArgs = Pick<
  UseArchitectureDraftAutosaveArgs,
  | "draftId"
  | "enabled"
  | "deferCreateUntilFirstSave"
  | "scopeGateOpen"
  | "scopeBullets"
  | "onDraftCreated"
  | "onImmutableDraftDetected"
> & {
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly hasUnsavedChanges: boolean;
  readonly writePersistedBaseline: (fields: ArchitectureDraftFieldState, actorSet: ActorSet) => void;
  readonly setSaveState: (state: ArchitectureDraftSaveState) => void;
  readonly setLastSavedUtc: (value: string | null) => void;
  readonly setConflictMessage: (value: string | null) => void;
  readonly setHasPersistedDraft: (value: boolean) => void;
  readonly serverUpdatedUtcRef: React.MutableRefObject<string | null>;
  readonly fieldsRef: React.MutableRefObject<ArchitectureDraftFieldState>;
  readonly actorSetRef: React.MutableRefObject<ActorSet>;
  readonly scopeGateOpenRef: React.MutableRefObject<boolean>;
  readonly scopeBulletsRef: React.MutableRefObject<readonly import("@/lib/architecture/architecture-scope-understanding-check").ScopeUnderstandingBullet[]>;
  readonly resolvedDraftIdRef: React.MutableRefObject<string | null>;
  readonly autosaveBlockedRef: React.MutableRefObject<boolean>;
  readonly markDirty: () => void;
};

export function useArchitectureDraftAutosavePersist(args: UseArchitectureDraftAutosavePersistArgs) {
  const enabled = args.enabled !== false;
  const deferCreateUntilFirstSave = args.deferCreateUntilFirstSave === true;
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  const saveSequenceRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightSaveRef = useRef<Promise<boolean> | null>(null);
  const trailingSaveNeededRef = useRef(false);
  const persistDraftRef = useRef<() => Promise<boolean>>(async () => false);

  const persistDraft = useCallback(async (options?: { readonly forceOverwrite?: boolean }): Promise<boolean> => {
    const forceOverwrite = options?.forceOverwrite === true;

    if (!enabled) return true;
    if (!isOnline) {
      const draftId = args.resolvedDraftIdRef.current ?? args.draftId;

      if (
        draftId.trim().length > 0 &&
        hasArchitectureDraftSaveableContent(args.fieldsRef.current) &&
        validateArchitectureDraftIntegrity(args.fieldsRef.current).isValid
      ) {
        enqueueArchitectureDraftOfflinePatch({
          draftId,
          payloadJson: JSON.stringify(
            buildArchitectureDraftPatchPayload(
              args.fieldsRef.current,
              args.actorSetRef.current,
              args.scopeGateOpenRef.current ? args.scopeBulletsRef.current : undefined,
            ),
          ),
          queuedAtUtc: new Date().toISOString(),
        });
      } else if (
        deferCreateUntilFirstSave &&
        args.resolvedDraftIdRef.current === null &&
        hasArchitectureDraftSaveableContent(args.fieldsRef.current) &&
        validateArchitectureDraftIntegrity(args.fieldsRef.current).isValid
      ) {
        writeArchitectureNewDraftRecovery({
          fields: args.fieldsRef.current,
          actorSet: args.actorSetRef.current,
          queuedAtUtc: new Date().toISOString(),
        });
      }

      args.setSaveState("offline");

      return false;
    }

    const latestFields = args.fieldsRef.current;
    if (!hasArchitectureDraftSaveableContent(latestFields)) {
      args.setSaveState("idle");
      return false;
    }

    if (!validateArchitectureDraftIntegrity(latestFields).isValid) {
      args.setSaveState("unsaved");
      return false;
    }

    if (inFlightSaveRef.current !== null) {
      trailingSaveNeededRef.current = true;
      return inFlightSaveRef.current;
    }

    const sequence = saveSequenceRef.current + 1;
    saveSequenceRef.current = sequence;
    args.setSaveState("saving");
    args.setConflictMessage(null);

    const savePromise = (async (): Promise<boolean> => {
      let patchFailedNonRetryable = false;
      try {
        let draftId = args.resolvedDraftIdRef.current ?? args.draftId;

        if (deferCreateUntilFirstSave && args.resolvedDraftIdRef.current === null) {
          const confirmedScopeBullets = args.scopeGateOpenRef.current ? args.scopeBulletsRef.current : undefined;
          const created = await createDraftRequest(
            createIntentForDeferredDraft(args.fieldsRef.current, confirmedScopeBullets),
            CREATE_ARCHITECTURE_INTENT,
          );
          args.resolvedDraftIdRef.current = created.draftId;
          draftId = created.draftId;
          args.setHasPersistedDraft(true);
          args.onDraftCreated?.(created.draftId);
          void invalidateArchitectureDraftListQueries();
          clearArchitectureNewDraftRecovery();
        }

        const latestServer = await getDraftRequest(draftId);
        if (latestServer.status !== "Drafting") {
          args.onImmutableDraftDetected?.(latestServer);
          args.setConflictMessage(null);
          args.setSaveState("idle");
          patchFailedNonRetryable = true;
          return false;
        }

        if (
          !forceOverwrite &&
          args.serverUpdatedUtcRef.current !== null &&
          latestServer.updatedUtc !== args.serverUpdatedUtcRef.current
        ) {
          args.setConflictMessage(
            "This architecture was updated in another session. Keep your edits or load the server copy before saving again.",
          );
          args.setSaveState("error");
          patchFailedNonRetryable = true;
          return false;
        }

        const patchPayload = buildArchitectureDraftPatchPayload(
          args.fieldsRef.current,
          args.actorSetRef.current,
          args.scopeGateOpenRef.current ? args.scopeBulletsRef.current : undefined,
        );

        const patched = await patchDraftRequest(draftId, {
          ...patchPayload,
          ...(forceOverwrite
            ? { forceOverwrite: true }
            : args.serverUpdatedUtcRef.current !== null
              ? { expectedUpdatedUtc: args.serverUpdatedUtcRef.current }
              : {}),
        });

        if (sequence !== saveSequenceRef.current) return false;

        args.writePersistedBaseline(fieldsFromDraftDocument(patched), actorSetFromDraftDocument(patched));
        args.serverUpdatedUtcRef.current = patched.updatedUtc;
        args.setLastSavedUtc(patched.updatedUtc);
        upsertArchitectureDraftRegistryEntry(buildArchitectureDraftRegistryEntry(patched));
        void invalidateArchitectureDraftListQueries();
        args.setSaveState("saved");
        return true;
      } catch (error) {
        if (sequence === saveSequenceRef.current) {
          args.setSaveState("error");

          if (isApiRequestError(error) && error.httpStatus === 409) {
            args.setConflictMessage(
              "This architecture was updated in another session. Keep your edits or load the server copy before saving again.",
            );
          }
        }

        patchFailedNonRetryable = isNonRetryableDraftPatchError(error);
        if (patchFailedNonRetryable) args.autosaveBlockedRef.current = true;
        return false;
      } finally {
        inFlightSaveRef.current = null;
        const shouldRunTrailingSave = !patchFailedNonRetryable && trailingSaveNeededRef.current;
        trailingSaveNeededRef.current = false;
        if (shouldRunTrailingSave && hasArchitectureDraftSaveableContent(args.fieldsRef.current)) {
          void persistDraftRef.current();
        }
      }
    })();

    inFlightSaveRef.current = savePromise;
    return savePromise;
  }, [args, deferCreateUntilFirstSave, enabled, isOnline]);

  persistDraftRef.current = () => persistDraft();

  const keepLocalDraftOnConflict = useCallback(async (): Promise<boolean> => {
    args.autosaveBlockedRef.current = false;
    args.setConflictMessage(null);

    return persistDraft({ forceOverwrite: true });
  }, [args, persistDraft]);

  useEffect(() => {
    args.autosaveBlockedRef.current = false;
  }, [args, args.fields]);

  useEffect(() => {
    if (!enabled || !args.hasUnsavedChanges || args.autosaveBlockedRef.current) return;
    if (!hasArchitectureDraftSaveableContent(args.fields)) return;
    args.markDirty();
    if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => void persistDraft(), ARCHITECTURE_DRAFT_AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
    };
  }, [args, args.fields, args.actorSet, args.hasUnsavedChanges, enabled, persistDraft]);

  useEffect(() => {
    async function replayOfflineQueue(): Promise<void> {
      const queued = listArchitectureDraftOfflineQueue();

      for (const entry of queued) {
        try {
          const body = JSON.parse(entry.payloadJson) as Parameters<typeof patchDraftRequest>[1];
          await patchDraftRequest(entry.draftId, body);
          dequeueArchitectureDraftOfflinePatch(entry.draftId);
        }
        catch {
          break;
        }
      }

      if (args.hasUnsavedChanges && hasArchitectureDraftSaveableContent(args.fields)) {
        void persistDraft();
      }
    }

    function handleOnline() {
      void replayOfflineQueue();
    }

    function handleOffline() {
      args.setSaveState("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [args, args.fields, args.actorSet, args.hasUnsavedChanges, persistDraft]);

  return { persistDraft, keepLocalDraftOnConflict };
}
