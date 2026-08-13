"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ARCHITECTURE_CREATION_BOOTSTRAP_INTENT } from "@/lib/architecture/architecture-creation-bootstrap";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import {
  hasArchitectureDraftSaveableContent,
  validateArchitectureDraftIntegrity,
} from "@/lib/architecture/architecture-draft-readiness";
import { buildDefaultActorSet, createDraftRequest, getDraftRequest, patchDraftRequest } from "@/lib/api/draft-intake-api";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import { normalizeActorSetForAdmission } from "@/lib/draft-intake-actor-suggestions";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

/** `idle` = loaded / pristine — do not show "Saved" until a user-driven persist succeeds. */
export type ArchitectureDraftSaveState = "idle" | "saved" | "saving" | "unsaved" | "error" | "offline";

const AUTOSAVE_DEBOUNCE_MS = 1500;

type UseArchitectureDraftAutosaveArgs = {
  readonly architectureId: string;
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly enabled?: boolean;
  /** When true, skip server writes until the operator enters saveable field content. */
  readonly deferCreateUntilFirstSave?: boolean;
  readonly onDraftCreated?: (draftId: string) => void;
  readonly onDraftLoaded?: (draft: DraftRequestResponse) => void;
};

type UseArchitectureDraftAutosaveResult = {
  readonly saveState: ArchitectureDraftSaveState;
  readonly lastSavedUtc: string | null;
  readonly conflictMessage: string | null;
  readonly saveDraft: () => Promise<boolean>;
  readonly markDirty: () => void;
  readonly reloadDraft: () => Promise<void>;
  /**
   * Align the autosave baseline with form state already applied from the server (initial load).
   * Prevents a spurious post-load PATCH that can race with later edits.
   */
  readonly acceptServerBaseline: (
    fields: ArchitectureDraftFieldState,
    serverUpdatedUtc: string,
  ) => void;
  readonly hasPersistedDraft: boolean;
};

function fieldsAreEqual(left: ArchitectureDraftFieldState, right: ArchitectureDraftFieldState): boolean {
  return (
    left.freeTextIntent === right.freeTextIntent &&
    left.businessOutcome === right.businessOutcome &&
    left.systemName === right.systemName
  );
}

function fieldsFromDraftDocument(draft: DraftRequestResponse): ArchitectureDraftFieldState {
  return {
    freeTextIntent: draft.document.freeTextIntent,
    businessOutcome: draft.document.businessOutcome ?? "",
    systemName: draft.document.systemName ?? "",
  };
}

function createIntentForDeferredDraft(fields: ArchitectureDraftFieldState): string {
  const trimmedIntent = fields.freeTextIntent.trim();

  if (trimmedIntent.length > 0) {
    return trimmedIntent;
  }

  return ARCHITECTURE_CREATION_BOOTSTRAP_INTENT;
}

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
  // Bumped whenever persistedFieldsRef changes so dirty detection re-runs after save/load.
  const [baselineRevision, setBaselineRevision] = useState(0);
  const persistedFieldsRef = useRef<ArchitectureDraftFieldState>(args.fields);
  const fieldsRef = useRef(args.fields);
  const actorSetRef = useRef(args.actorSet);
  const serverUpdatedUtcRef = useRef<string | null>(null);
  const saveSequenceRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightSaveRef = useRef<Promise<boolean> | null>(null);
  const trailingSaveNeededRef = useRef(false);
  const persistDraftRef = useRef<() => Promise<boolean>>(async () => false);
  const resolvedArchitectureIdRef = useRef<string | null>(
    deferCreateUntilFirstSave ? null : args.architectureId,
  );

  fieldsRef.current = args.fields;
  actorSetRef.current = args.actorSet;

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  const hasUnsavedChanges = useMemo(
    () => !fieldsAreEqual(args.fields, persistedFieldsRef.current),
    [args.fields, baselineRevision],
  );

  const writePersistedBaseline = useCallback((fields: ArchitectureDraftFieldState) => {
    persistedFieldsRef.current = fields;
    setBaselineRevision((current) => current + 1);
  }, []);

  const acceptServerBaseline = useCallback(
    (fields: ArchitectureDraftFieldState, serverUpdatedUtc: string) => {
      serverUpdatedUtcRef.current = serverUpdatedUtc;
      writePersistedBaseline(fields);
      setLastSavedUtc(null);
      setConflictMessage(null);
      setSaveState("idle");
      setHasPersistedDraft(true);
    },
    [writePersistedBaseline],
  );

  const persistDraft = useCallback(async (): Promise<boolean> => {
    if (!enabled) {
      return true;
    }

    if (!isOnline) {
      setSaveState("offline");

      return false;
    }

    const latestFields = fieldsRef.current;

    if (!hasArchitectureDraftSaveableContent(latestFields)) {
      setSaveState("idle");

      return false;
    }

    const validation = validateArchitectureDraftIntegrity(latestFields);

    if (!validation.isValid) {
      setSaveState("unsaved");

      return false;
    }

    if (inFlightSaveRef.current !== null) {
      // Stale in-flight PATCH must not drop edits typed while the request was outstanding.
      trailingSaveNeededRef.current = true;

      return inFlightSaveRef.current;
    }

    const sequence = saveSequenceRef.current + 1;
    saveSequenceRef.current = sequence;
    setSaveState("saving");
    setConflictMessage(null);

    const savePromise = (async (): Promise<boolean> => {
      try {
        let architectureId = resolvedArchitectureIdRef.current ?? args.architectureId;

        if (deferCreateUntilFirstSave && resolvedArchitectureIdRef.current === null) {
          const created = await createDraftRequest(
            createIntentForDeferredDraft(fieldsRef.current),
            CREATE_ARCHITECTURE_INTENT,
          );
          resolvedArchitectureIdRef.current = created.draftId;
          architectureId = created.draftId;
          setHasPersistedDraft(true);
          args.onDraftCreated?.(created.draftId);
        }

        const latestServer = await getDraftRequest(architectureId);

        if (
          serverUpdatedUtcRef.current !== null &&
          latestServer.updatedUtc !== serverUpdatedUtcRef.current
        ) {
          setConflictMessage(
            "This architecture was updated in another session. Refresh to load the latest version before saving again.",
          );
          setSaveState("error");

          return false;
        }

        // Re-read immediately before PATCH so a long GET cannot freeze older field values.
        const fieldsForPatch = fieldsRef.current;
        const actorSetForPatch = actorSetRef.current;

        const patched = await patchDraftRequest(architectureId, {
          freeTextIntent: fieldsForPatch.freeTextIntent.trim(),
          businessOutcome: fieldsForPatch.businessOutcome.trim(),
          systemName: fieldsForPatch.systemName.trim() || undefined,
          actorSet: normalizeActorSetForAdmission(
            actorSetForPatch.actors.length > 0 ? actorSetForPatch : buildDefaultActorSet(),
          ),
          workflowIntent: CREATE_ARCHITECTURE_INTENT,
        });

        if (sequence !== saveSequenceRef.current) {
          return false;
        }

        writePersistedBaseline(fieldsFromDraftDocument(patched));
        serverUpdatedUtcRef.current = patched.updatedUtc;
        setLastSavedUtc(patched.updatedUtc);
        upsertArchitectureDraftRegistryEntry(buildArchitectureDraftRegistryEntry(patched));
        setSaveState("saved");

        return true;
      } catch {
        if (sequence === saveSequenceRef.current) {
          setSaveState("error");
        }

        return false;
      } finally {
        inFlightSaveRef.current = null;

        const stillDirtyRelativeToBaseline = !fieldsAreEqual(
          fieldsRef.current,
          persistedFieldsRef.current,
        );
        const shouldRunTrailingSave = trailingSaveNeededRef.current || stillDirtyRelativeToBaseline;
        trailingSaveNeededRef.current = false;

        if (shouldRunTrailingSave && hasArchitectureDraftSaveableContent(fieldsRef.current)) {
          void persistDraftRef.current();
        }
      }
    })();

    inFlightSaveRef.current = savePromise;

    return savePromise;
  }, [
    args.architectureId,
    args.onDraftCreated,
    deferCreateUntilFirstSave,
    enabled,
    isOnline,
    writePersistedBaseline,
  ]);

  persistDraftRef.current = persistDraft;

  const reloadDraft = useCallback(async () => {
    const architectureId = resolvedArchitectureIdRef.current ?? args.architectureId;
    const draft = await getDraftRequest(architectureId);
    args.onDraftLoaded?.(draft);
  }, [args]);

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

  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) {
      return;
    }

    if (!hasArchitectureDraftSaveableContent(args.fields)) {
      return;
    }

    markDirty();

    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void persistDraft();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [args.fields, enabled, hasUnsavedChanges, markDirty, persistDraft]);

  useEffect(() => {
    function handleOnline() {
      if (hasUnsavedChanges && hasArchitectureDraftSaveableContent(args.fields)) {
        void persistDraft();
      }
    }

    function handleOffline() {
      setSaveState("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [args.fields, hasUnsavedChanges, persistDraft]);

  return {
    saveState,
    lastSavedUtc,
    conflictMessage,
    saveDraft: persistDraft,
    markDirty,
    reloadDraft,
    acceptServerBaseline,
    hasPersistedDraft,
  };
}
