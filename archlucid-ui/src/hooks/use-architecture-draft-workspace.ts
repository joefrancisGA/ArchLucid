"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import {
  actorSetFromDraftDocument,
  applyArchitectureCreationDraftToFormState,
  architectureCreationDefaultActorSet,
} from "@/lib/architecture/architecture-creation-init";
import {
  architectureDraftSpawnedRunId,
  isArchitectureDraftHandoffAcknowledged,
} from "@/lib/architecture/architecture-draft-handoff-gate";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import { isArchitectureNewDraftSegment } from "@/lib/architecture/architecture-routes";
import { getDraftRequest } from "@/lib/api/draft-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import type { ActorSet, DraftRequestResponse } from "@/types/draft-intake";

export type ArchitectureDraftHydratedHandler = (
  loaded: DraftRequestResponse,
  formState: ArchitectureDraftFieldState,
) => void;

type UseArchitectureDraftWorkspaceOptions = {
  readonly architectureId: string;
  readonly onDraftHydratedRef?: MutableRefObject<ArchitectureDraftHydratedHandler | undefined>;
};

export function useArchitectureDraftWorkspace(options: UseArchitectureDraftWorkspaceOptions) {
  const queryClient = useQueryClient();
  const isNewDraft = isArchitectureNewDraftSegment(options.architectureId);
  const { blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();

  const [loading, setLoading] = useState(!isNewDraft);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftRequestResponse | null>(null);
  const [fields, setFields] = useState({
    freeTextIntent: "",
    businessOutcome: "",
    systemName: "",
    structuredBrief: emptyArchitectureDraftStructuredBrief(),
  });
  const [actorSet, setActorSet] = useState<ActorSet>(() => architectureCreationDefaultActorSet());
  const [handoffAcknowledged, setHandoffAcknowledged] = useState(false);
  const [resolvedDraftId, setResolvedDraftId] = useState<string | null>(null);

  const loadDraftInFlightRef = useRef<Promise<void> | null>(null);
  const linkedReviewId = architectureDraftSpawnedRunId(draft);
  const handoffEditorLocked = linkedReviewId !== null && !handoffAcknowledged;

  const applyLoadedDraftToForm = useCallback((loaded: DraftRequestResponse) => {
    const formState = applyArchitectureCreationDraftToFormState(loaded);
    setDraft(loaded);
    setFields(formState);
    setActorSet(actorSetFromDraftDocument(loaded));

    return formState;
  }, []);

  const loadDraft = useCallback(async () => {
    if (isNewDraft) {
      return;
    }

    if (loadDraftInFlightRef.current !== null) {
      return loadDraftInFlightRef.current;
    }

    const loadPromise = (async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const loaded = await queryClient.fetchQuery({
          queryKey: operatorQueryKeys.architectureDraft(options.architectureId),
          queryFn: () => getDraftRequest(options.architectureId),
          staleTime: OPERATOR_QUERY_STALE_MS,
        });

        const formState = applyLoadedDraftToForm(loaded);
        options.onDraftHydratedRef?.current?.(loaded, formState);
        setHandoffAcknowledged(isArchitectureDraftHandoffAcknowledged(options.architectureId));
        upsertArchitectureDraftRegistryEntry(
          buildArchitectureDraftRegistryEntry(loaded, {
            linkedReviewId: architectureDraftSpawnedRunId(loaded),
          }),
        );
      } catch (err) {
        if (isApiRequestError(err) && err.httpStatus === 429) {
          const waitSec = err.retryAfterSeconds;
          const waitHint =
            waitSec !== null && waitSec > 0
              ? ` Wait about ${waitSec} second${waitSec === 1 ? "" : "s"}, then retry.`
              : " Wait a short time, then retry.";

          setLoadError(`Too many requests while loading this draft.${waitHint}`);
        } else {
          setLoadError("Could not load this architecture draft.");
        }
      } finally {
        setLoading(false);
      }
    })();

    loadDraftInFlightRef.current = loadPromise;

    try {
      await loadPromise;
    } finally {
      if (loadDraftInFlightRef.current === loadPromise) {
        loadDraftInFlightRef.current = null;
      }
    }
  }, [applyLoadedDraftToForm, isNewDraft, options.architectureId, options.onDraftHydratedRef, queryClient]);

  useEffect(() => {
    if (isNewDraft) {
      return;
    }

    void loadDraft();
  }, [isNewDraft, loadDraft]);

  return {
    isNewDraft,
    loading,
    loadError,
    draft,
    setDraft,
    fields,
    setFields,
    actorSet,
    setActorSet,
    handoffAcknowledged,
    setHandoffAcknowledged,
    resolvedDraftId,
    setResolvedDraftId,
    linkedReviewId,
    handoffEditorLocked,
    blocksLlmExecution,
    loadDraft,
    applyLoadedDraftToForm,
  };
}
