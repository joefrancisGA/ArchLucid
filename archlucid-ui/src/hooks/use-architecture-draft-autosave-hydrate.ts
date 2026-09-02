"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { getDraftRequest } from "@/lib/api/draft-intake-api";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

import {
  actorSetsAreEqual,
  fieldsAreEqual,
  type ArchitectureDraftSaveState,
} from "@/hooks/architecture-draft-autosave-shared";

type UseArchitectureDraftAutosaveHydrateArgs = {
  readonly architectureId: string;
  readonly fields: ArchitectureDraftFieldState;
  readonly actorSet: ActorSet;
  readonly deferCreateUntilFirstSave: boolean;
  readonly onDraftLoaded?: (draft: DraftRequestResponse) => void;
  readonly setSaveState: (state: ArchitectureDraftSaveState) => void;
  readonly setLastSavedUtc: (value: string | null) => void;
  readonly setConflictMessage: (value: string | null) => void;
  readonly setHasPersistedDraft: (value: boolean) => void;
};

export function useArchitectureDraftAutosaveHydrate(args: UseArchitectureDraftAutosaveHydrateArgs) {
  const [baselineRevision, setBaselineRevision] = useState(0);
  const persistedFieldsRef = useRef(args.fields);
  const persistedActorSetRef = useRef(args.actorSet);
  const serverUpdatedUtcRef = useRef<string | null>(null);
  const resolvedArchitectureIdRef = useRef<string | null>(
    args.deferCreateUntilFirstSave ? null : args.architectureId,
  );

  const hasUnsavedChanges = useMemo(
    () =>
      !fieldsAreEqual(args.fields, persistedFieldsRef.current) ||
      !actorSetsAreEqual(args.actorSet, persistedActorSetRef.current),
    [args.fields, args.actorSet, baselineRevision],
  );

  const writePersistedBaseline = useCallback((fields: ArchitectureDraftFieldState, actorSet: ActorSet) => {
    persistedFieldsRef.current = fields;
    persistedActorSetRef.current = actorSet;
    setBaselineRevision((current) => current + 1);
  }, []);

  const acceptServerBaseline = useCallback(
    (fields: ArchitectureDraftFieldState, serverUpdatedUtc: string, actorSet: ActorSet) => {
      serverUpdatedUtcRef.current = serverUpdatedUtc;
      writePersistedBaseline(fields, actorSet);
      args.setLastSavedUtc(null);
      args.setConflictMessage(null);
      args.setSaveState("idle");
      args.setHasPersistedDraft(true);
    },
    [args, writePersistedBaseline],
  );

  const syncServerUpdatedUtc = useCallback(
    (serverUpdatedUtc: string) => {
      serverUpdatedUtcRef.current = serverUpdatedUtc;
      args.setConflictMessage(null);
    },
    [args],
  );

  const reloadDraft = useCallback(async () => {
    const architectureId = resolvedArchitectureIdRef.current ?? args.architectureId;
    const draft = await getDraftRequest(architectureId);
    args.onDraftLoaded?.(draft);
  }, [args]);

  return {
    hasUnsavedChanges,
    writePersistedBaseline,
    acceptServerBaseline,
    syncServerUpdatedUtc,
    reloadDraft,
    serverUpdatedUtcRef,
    resolvedArchitectureIdRef,
  };
}
