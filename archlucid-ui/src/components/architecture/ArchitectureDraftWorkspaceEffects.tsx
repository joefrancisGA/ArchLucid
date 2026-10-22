"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import { architectureDraftSpawnedRunId } from "@/lib/architecture/architecture-draft-handoff-gate";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { type ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { actorSetFromDraftDocument } from "@/lib/architecture/architecture-creation-init";
import { getDraftRequest } from "@/lib/api/draft-intake-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

export type UseArchitectureDraftWorkspaceEffectsArgs = {
  readonly draftId: string;
  readonly isNewDraft: boolean;
  readonly loading: boolean;
  readonly draft: DraftRequestResponse | null;
  readonly linkedReviewId: string | null;
  readonly saveState: ArchitectureDraftSaveState;
  readonly effectiveDraftId: string;
  readonly applyLoadedDraftToForm: (loaded: DraftRequestResponse) => ArchitectureDraftFieldState;
  readonly acceptServerBaselineRef: React.MutableRefObject<
    (fields: ArchitectureDraftFieldState, serverUpdatedUtc: string, actorSet: ActorSet) => void
  >;
};

export function useArchitectureDraftWorkspaceEffects(
  args: UseArchitectureDraftWorkspaceEffectsArgs,
): void {
  const queryClient = useQueryClient();
  const syncDraftInFlightRef = useRef<Promise<void> | null>(null);
  const draftLifecycleRef = useRef<{
    status: DraftRequestResponse["status"] | null;
    spawnedRunId: string | null;
  }>({
    status: null,
    spawnedRunId: null,
  });

  useEffect(() => {
    draftLifecycleRef.current = {
      status: args.draft?.status ?? null,
      spawnedRunId: architectureDraftSpawnedRunId(args.draft),
    };
  }, [args.draft]);

  const syncDraftFromServer = useCallback(async () => {
    if (args.isNewDraft || args.loading) {
      return;
    }

    if (syncDraftInFlightRef.current !== null) {
      return syncDraftInFlightRef.current;
    }

    const syncPromise = (async () => {
      try {
        const loaded = await queryClient.fetchQuery({
          queryKey: operatorQueryKeys.architectureDraft(args.draftId),
          queryFn: () => getDraftRequest(args.draftId),
          staleTime: OPERATOR_QUERY_STALE_MS,
        });
        const prior = draftLifecycleRef.current;
        const nextSpawnedRunId = architectureDraftSpawnedRunId(loaded);

        if (prior.status === loaded.status && prior.spawnedRunId === nextSpawnedRunId) {
          return;
        }

        const formState = args.applyLoadedDraftToForm(loaded);
        args.acceptServerBaselineRef.current(
          formState,
          loaded.updatedUtc,
          actorSetFromDraftDocument(loaded),
        );
        upsertArchitectureDraftRegistryEntry(
          buildArchitectureDraftRegistryEntry(loaded, {
            linkedReviewId: nextSpawnedRunId,
          }),
        );
      } catch {
        // Background sync must not disrupt the workspace on transient network failures.
      }
    })();

    syncDraftInFlightRef.current = syncPromise;

    try {
      await syncPromise;
    } finally {
      if (syncDraftInFlightRef.current === syncPromise) {
        syncDraftInFlightRef.current = null;
      }
    }
  }, [args, queryClient]);

  useEffect(() => {
    if (args.isNewDraft) {
      return;
    }

    function handleResume() {
      if (document.visibilityState !== "visible") {
        return;
      }

      void syncDraftFromServer();
    }

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, [args.isNewDraft, syncDraftFromServer]);
}
