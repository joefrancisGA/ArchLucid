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
  enqueueArchitectureDraftOfflinePatch,
  ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION,
} from "@/lib/architecture/architecture-draft-offline-queue";
import { replayArchitectureDraftOfflineQueue } from "@/lib/architecture/architecture-draft-offline-queue-replay";
import {
  applyOnlineDraftPatchCas,
  resolveOnlineDraftPatchCas,
} from "@/lib/architecture/architecture-draft-patch-cas-online";
import {
  architectureDraftCasConflictMessage,
  DRAFT_CAS_STALE_CODE,
  readDraftCasConflictCode,
} from "@/lib/architecture/architecture-draft-patch-cas";
import {
  clearArchitectureNewDraftRecovery,
  readArchitectureNewDraftRecovery,
  writeArchitectureNewDraftRecovery,
} from "@/lib/architecture/architecture-new-draft-recovery";
import { isApiRequestError } from "@/lib/api-request-error";
import { architectureDraftAutosavePatchBlockedReason, architectureDraftCreateMutationBlockedReason } from "@/lib/architecture/architecture-draft-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createDraftRequest, getDraftRequest, patchDraftRequest } from "@/lib/api/draft-intake-api";
import { patchDraftRequestWith401Resume } from "@/lib/auth/livelihood-mutation-401-resume-wrappers";
import { isLivelihoodMutation401RedirectError } from "@/lib/auth/livelihood-mutation-401-resume";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import { readOperatorScopeWriteMismatchMessage, type OperatorScopeWriteStamp } from "@/lib/operator/operator-scope-write-stamp";
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
  readonly livelihoodReturnPath?: string;
  readonly scopeWriteStamp: OperatorScopeWriteStamp;
};

export function useArchitectureDraftAutosavePersist(args: UseArchitectureDraftAutosavePersistArgs) {
  const enabled = args.enabled !== false;
  const deferCreateUntilFirstSave = args.deferCreateUntilFirstSave === true;
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  const saveSequenceRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightSaveRef = useRef<Promise<boolean> | null>(null);
  const trailingSaveNeededRef = useRef(false);
  const lastPersistWasConflictRef = useRef(false);
  const persistDraftRef = useRef<() => Promise<boolean>>(async () => false);

  const persistDraft = useCallback(async (options?: { readonly forceOverwrite?: boolean }): Promise<boolean> => {
    const forceOverwrite = options?.forceOverwrite === true;

    if (!enabled) return true;

    const scopeMismatchMessage = readOperatorScopeWriteMismatchMessage(args.scopeWriteStamp);

    if (scopeMismatchMessage !== null) {
      args.setConflictMessage(scopeMismatchMessage);
      args.setSaveState("error");

      return false;
    }

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
          expectedUpdatedUtc: args.serverUpdatedUtcRef.current,
          schemaVersion: ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION,
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
    lastPersistWasConflictRef.current = false;
    args.setSaveState("saving");
    args.setConflictMessage(null);

    const savePromise = (async (): Promise<boolean> => {
      let patchFailedNonRetryable = false;
      try {
        let draftId = args.resolvedDraftIdRef.current ?? args.draftId;
        let createdThisPersist = false;

        if (deferCreateUntilFirstSave && args.resolvedDraftIdRef.current === null) {
          const confirmedScopeBullets = args.scopeGateOpenRef.current ? args.scopeBulletsRef.current : undefined;
          const created = await createDraftRequest(
            createIntentForDeferredDraft(args.fieldsRef.current, confirmedScopeBullets),
            CREATE_ARCHITECTURE_INTENT,
          );
          args.resolvedDraftIdRef.current = created.draftId;
          draftId = created.draftId;
          args.setHasPersistedDraft(true);
          const createdArchitectureId = created.architectureId?.trim() ?? "";

          if (createdArchitectureId.length > 0) {
            args.onDraftCreated?.({
              draftId: created.draftId,
              architectureId: createdArchitectureId,
            });
          }

          void invalidateArchitectureDraftListQueries();
          clearArchitectureNewDraftRecovery();
          args.serverUpdatedUtcRef.current = created.updatedUtc;
          createdThisPersist = true;
        }

        const latestServer = await getDraftRequest(draftId);

        if (latestServer.status !== "Drafting") {
          args.onImmutableDraftDetected?.(latestServer);
          args.setConflictMessage(null);
          args.setSaveState("idle");
          patchFailedNonRetryable = true;
          return false;
        }

        const casDecision = resolveOnlineDraftPatchCas({
          forceOverwrite,
          createdThisPersist,
          knownUpdatedUtc: args.serverUpdatedUtcRef.current,
          latestServerUpdatedUtc: latestServer.updatedUtc,
        });

        if (casDecision.kind === "conflict") {
          lastPersistWasConflictRef.current = true;
          args.setConflictMessage(architectureDraftCasConflictMessage(DRAFT_CAS_STALE_CODE));
          args.setSaveState("error");
          patchFailedNonRetryable = true;
          return false;
        }

        if (casDecision.kind === "token") {
          args.serverUpdatedUtcRef.current = casDecision.expectedUpdatedUtc;
        }

        const patchPayload = buildArchitectureDraftPatchPayload(
          args.fieldsRef.current,
          args.actorSetRef.current,
          args.scopeGateOpenRef.current ? args.scopeBulletsRef.current : undefined,
        );

        const patchBody = applyOnlineDraftPatchCas(patchPayload, casDecision);
        const livelihoodReturnPath = args.livelihoodReturnPath?.trim() ?? "";

        const patched =
          livelihoodReturnPath.length > 0
            ? await patchDraftRequestWith401Resume(draftId, patchBody, {
                returnPath: livelihoodReturnPath,
                idempotencyKey: createGovernanceMutationIdempotencyKey(),
              })
            : await patchDraftRequest(draftId, patchBody);

        if (sequence !== saveSequenceRef.current) return false;

        args.writePersistedBaseline(fieldsFromDraftDocument(patched), actorSetFromDraftDocument(patched));
        args.serverUpdatedUtcRef.current = patched.updatedUtc;
        args.setLastSavedUtc(patched.updatedUtc);
        upsertArchitectureDraftRegistryEntry(buildArchitectureDraftRegistryEntry(patched));
        void invalidateArchitectureDraftListQueries();
        args.setSaveState("saved");
        return true;
      } catch (error) {
        if (isLivelihoodMutation401RedirectError(error)) {
          patchFailedNonRetryable = true;

          return false;
        }

        if (sequence === saveSequenceRef.current) {
          args.setSaveState("error");

          if (isApiRequestError(error) && error.httpStatus === 409) {
            lastPersistWasConflictRef.current = true;
            const failure = toApiLoadFailure(error);
            args.setConflictMessage(
              architectureDraftCreateMutationBlockedReason(failure)
                ?? architectureDraftAutosavePatchBlockedReason(failure)
                ?? architectureDraftCasConflictMessage(readDraftCasConflictCode(error)),
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
      const result = await replayArchitectureDraftOfflineQueue();

      if (result.conflict !== null) {
        args.setConflictMessage(result.conflict.message);
        args.setSaveState("error");
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

  return {
    persistDraft,
    keepLocalDraftOnConflict,
    wasLastSaveConflict: () => lastPersistWasConflictRef.current,
  };
}
