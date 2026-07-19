"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture-draft-registry";
import type { ArchitectureDraftFieldState } from "@/lib/architecture-draft-readiness";
import { validateArchitectureDraftIntegrity } from "@/lib/architecture-draft-readiness";
import { buildDefaultActorSet, getDraftRequest, patchDraftRequest } from "@/lib/api/draft-intake-api";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";
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
  readonly onDraftLoaded?: (draft: DraftRequestResponse) => void;
};

type UseArchitectureDraftAutosaveResult = {
  readonly saveState: ArchitectureDraftSaveState;
  readonly lastSavedUtc: string | null;
  readonly conflictMessage: string | null;
  readonly saveDraft: () => Promise<boolean>;
  readonly markDirty: () => void;
  readonly reloadDraft: () => Promise<void>;
};

function fieldsAreEqual(left: ArchitectureDraftFieldState, right: ArchitectureDraftFieldState): boolean {
  return (
    left.freeTextIntent === right.freeTextIntent &&
    left.businessOutcome === right.businessOutcome &&
    left.systemName === right.systemName
  );
}

/** Debounced server autosave for architecture drafts — never starts a review. */
export function useArchitectureDraftAutosave(
  args: UseArchitectureDraftAutosaveArgs,
): UseArchitectureDraftAutosaveResult {
  const enabled = args.enabled !== false;
  const [saveState, setSaveState] = useState<ArchitectureDraftSaveState>("idle");
  const [lastSavedUtc, setLastSavedUtc] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const persistedFieldsRef = useRef<ArchitectureDraftFieldState>(args.fields);
  const serverUpdatedUtcRef = useRef<string | null>(null);
  const saveSequenceRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightSaveRef = useRef<Promise<boolean> | null>(null);

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  const hasUnsavedChanges = useMemo(
    () => !fieldsAreEqual(args.fields, persistedFieldsRef.current),
    [args.fields],
  );

  const persistDraft = useCallback(async (): Promise<boolean> => {
    if (!enabled) {
      return true;
    }

    if (!isOnline) {
      setSaveState("offline");

      return false;
    }

    const validation = validateArchitectureDraftIntegrity(args.fields);

    if (!validation.isValid) {
      setSaveState("unsaved");

      return false;
    }

    if (inFlightSaveRef.current !== null) {
      return inFlightSaveRef.current;
    }

    const sequence = saveSequenceRef.current + 1;
    saveSequenceRef.current = sequence;
    setSaveState("saving");
    setConflictMessage(null);

    const savePromise = (async (): Promise<boolean> => {
      try {
        const latestServer = await getDraftRequest(args.architectureId);

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

        const patched = await patchDraftRequest(args.architectureId, {
          freeTextIntent: args.fields.freeTextIntent.trim(),
          businessOutcome: args.fields.businessOutcome.trim(),
          systemName: args.fields.systemName.trim() || undefined,
          actorSet: normalizeActorSetForAdmission(
            args.actorSet.actors.length > 0 ? args.actorSet : buildDefaultActorSet(),
          ),
          workflowIntent: CREATE_ARCHITECTURE_INTENT,
        });

        if (sequence !== saveSequenceRef.current) {
          return false;
        }

        persistedFieldsRef.current = {
          freeTextIntent: patched.document.freeTextIntent,
          businessOutcome: patched.document.businessOutcome ?? "",
          systemName: patched.document.systemName ?? "",
        };
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
      }
    })();

    inFlightSaveRef.current = savePromise;

    return savePromise;
  }, [args.actorSet, args.architectureId, args.fields, enabled, isOnline]);

  const reloadDraft = useCallback(async () => {
    const draft = await getDraftRequest(args.architectureId);
    serverUpdatedUtcRef.current = draft.updatedUtc;
    persistedFieldsRef.current = {
      freeTextIntent: draft.document.freeTextIntent,
      businessOutcome: draft.document.businessOutcome ?? "",
      systemName: draft.document.systemName ?? "",
    };
    setLastSavedUtc(null);
    setConflictMessage(null);
    // Fresh load / conflict refresh — baseline is synced; wait for a user save before "Saved".
    setSaveState("idle");
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
  }, [enabled, hasUnsavedChanges, markDirty, persistDraft, args.fields]);

  useEffect(() => {
    function handleOnline() {
      if (hasUnsavedChanges) {
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
  }, [hasUnsavedChanges, persistDraft]);

  return {
    saveState,
    lastSavedUtc,
    conflictMessage,
    saveDraft: persistDraft,
    markDirty,
    reloadDraft,
  };
}
