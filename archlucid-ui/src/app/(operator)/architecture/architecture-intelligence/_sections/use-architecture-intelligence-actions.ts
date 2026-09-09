"use client";

import { useCallback, type RefObject } from "react";

import {
  buildRequest,
  getJson,
  postJson,
  primaryDescriptionFromSources,
} from "./architecture-intelligence-client-api";
import type {
  ClosedLoopReasoningResult,
  ClosedLoopReasoningSourceText,
  GoldenArchitectureTestResult,
} from "./architecture-intelligence-types";
import type { UseArchitectureIntelligenceProductContextResult } from "./use-architecture-intelligence-product-context";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { architectureIntelligenceRunMutationBlockedReason } from "@/lib/architecture/architecture-intelligence-run-mutation-blocked-reason";

function isStaleActionGeneration(
  actionGenerationRef: RefObject<number>,
  generation: number,
): boolean {
  return actionGenerationRef.current !== generation;
}

export type UseArchitectureIntelligenceActionsResult = {
  isBusy: boolean;
  analyzeThisReview: () => Promise<void>;
  runReasoning: () => Promise<void>;
  runGoldenTest: () => Promise<void>;
  loadGoldenFixture: () => Promise<void>;
  publishRun: () => Promise<void>;
  continueWithAnswers: () => Promise<void>;
};

export function useArchitectureIntelligenceActions(
  ctx: UseArchitectureIntelligenceProductContextResult,
): UseArchitectureIntelligenceActionsResult {
  const {
    architectureDescription,
    prioritiesRaw,
    interviewAnswers,
    publishToProduct,
    activeRunId,
    hydratedSourceTexts,
    reviewTier,
    canAnalyzeHydratedReview,
    setLoadingAction,
    setError,
    setPublishToProduct,
    setRunState,
    setInterviewAnswers,
    setActiveRunId,
    setHydratedSourceTexts,
    setArchitectureDescription,
    setPrioritiesRaw,
    markProductContextLoaded,
    loadingAction,
    actionGenerationRef,
    invalidateInFlightActions,
  } = ctx;

  const runReasoningWithOptions = useCallback(
    async (options?: { publish?: boolean; action?: "reasoning" | "analyze" }) => {
      if (architectureDescription.trim().length === 0) {
        setError("Architecture description is required (or load the golden fixture).");

        return;
      }

      const shouldPublish = options?.publish ?? publishToProduct;
      const action = options?.action ?? "reasoning";
      const generation = actionGenerationRef.current;

      setLoadingAction(action);
      setError(null);

      if (shouldPublish) {
        setPublishToProduct(true);
      }

      try {
        const result = await postJson<ClosedLoopReasoningResult>(
          "/api/proxy/v1/architecture-intelligence/run",
          buildRequest(architectureDescription, prioritiesRaw, interviewAnswers, {
            publishToProduct: shouldPublish,
            runId: activeRunId,
            hydratedSourceTexts,
            reviewTier,
          }),
        );

        if (isStaleActionGeneration(actionGenerationRef, generation)) {
          return;
        }

        setActiveRunId(result.runId ?? null);
        setRunState({ kind: "reasoning", result });
      } catch (cause) {
        if (isStaleActionGeneration(actionGenerationRef, generation)) {
          return;
        }

        const failure = toApiLoadFailure(cause);
        const blocked = architectureIntelligenceRunMutationBlockedReason(failure);

        setError(blocked ?? (cause instanceof Error ? cause.message : String(cause)));
      } finally {
        if (!isStaleActionGeneration(actionGenerationRef, generation)) {
          setLoadingAction(null);
        }
      }
    },
    [
      activeRunId,
      actionGenerationRef,
      architectureDescription,
      hydratedSourceTexts,
      interviewAnswers,
      prioritiesRaw,
      publishToProduct,
      reviewTier,
      setActiveRunId,
      setError,
      setLoadingAction,
      setPublishToProduct,
      setRunState,
    ],
  );

  const runReasoning = useCallback(async () => {
    await runReasoningWithOptions();
  }, [runReasoningWithOptions]);

  const analyzeThisReview = useCallback(async () => {
    if (!canAnalyzeHydratedReview) {
      setError("Load a product review intake before analyzing this review.");

      return;
    }

    await runReasoningWithOptions({ publish: true, action: "analyze" });
  }, [canAnalyzeHydratedReview, runReasoningWithOptions, setError]);

  const continueWithAnswers = useCallback(async () => {
    if (!activeRunId) {
      setError("Run an architecture reasoning pass first to obtain a run id.");

      return;
    }

    setLoadingAction("continue");
    setError(null);
    const generation = actionGenerationRef.current;

    try {
      const result = await postJson<ClosedLoopReasoningResult>(
        `/api/proxy/v1/architecture-intelligence/runs/${encodeURIComponent(activeRunId)}/continue`,
        buildRequest(architectureDescription, prioritiesRaw, interviewAnswers, {
          runId: activeRunId,
          continueFromExistingRun: true,
          publishToProduct,
          hydratedSourceTexts,
          reviewTier,
        }),
      );

      if (isStaleActionGeneration(actionGenerationRef, generation)) {
        return;
      }

      setActiveRunId(result.runId ?? activeRunId);
      setRunState({ kind: "reasoning", result });
    } catch (cause) {
      if (isStaleActionGeneration(actionGenerationRef, generation)) {
        return;
      }

      const failure = toApiLoadFailure(cause);
      const blocked = architectureIntelligenceRunMutationBlockedReason(failure);

      setError(blocked ?? (cause instanceof Error ? cause.message : String(cause)));
    } finally {
      if (!isStaleActionGeneration(actionGenerationRef, generation)) {
        setLoadingAction(null);
      }
    }
  }, [
    actionGenerationRef,
    activeRunId,
    architectureDescription,
    hydratedSourceTexts,
    interviewAnswers,
    prioritiesRaw,
    publishToProduct,
    reviewTier,
    setActiveRunId,
    setError,
    setLoadingAction,
    setRunState,
  ]);

  const publishRun = useCallback(async () => {
    if (!activeRunId) {
      setError("Run an architecture reasoning pass first to obtain a run id.");

      return;
    }

    setLoadingAction("publish");
    setError(null);
    const generation = actionGenerationRef.current;

    try {
      const result = await postJson<ClosedLoopReasoningResult>(
        `/api/proxy/v1/architecture-intelligence/runs/${encodeURIComponent(activeRunId)}/publish`,
        buildRequest(architectureDescription, prioritiesRaw, interviewAnswers, {
          runId: activeRunId,
          continueFromExistingRun: true,
          publishToProduct: true,
          hydratedSourceTexts,
          reviewTier,
        }),
      );

      if (isStaleActionGeneration(actionGenerationRef, generation)) {
        return;
      }

      setRunState({ kind: "reasoning", result });
    } catch (cause) {
      if (isStaleActionGeneration(actionGenerationRef, generation)) {
        return;
      }

      const failure = toApiLoadFailure(cause);
      const blocked = architectureIntelligenceRunMutationBlockedReason(failure);

      setError(blocked ?? (cause instanceof Error ? cause.message : String(cause)));
    } finally {
      if (!isStaleActionGeneration(actionGenerationRef, generation)) {
        setLoadingAction(null);
      }
    }
  }, [
    actionGenerationRef,
    activeRunId,
    architectureDescription,
    hydratedSourceTexts,
    interviewAnswers,
    prioritiesRaw,
    reviewTier,
    setError,
    setLoadingAction,
    setRunState,
  ]);

  const runGoldenTest = useCallback(async () => {
    const useFixture = architectureDescription.trim().length === 0 && hydratedSourceTexts.length === 0;

    setLoadingAction("golden");
    setError(null);
    const generation = actionGenerationRef.current;

    try {
      const result = await postJson<GoldenArchitectureTestResult>(
        "/api/proxy/v1/architecture-intelligence/golden-test",
        buildRequest(architectureDescription, prioritiesRaw, interviewAnswers, {
          useGoldenFixture: useFixture,
          hydratedSourceTexts,
          runId: activeRunId,
          reviewTier,
        }),
      );

      if (isStaleActionGeneration(actionGenerationRef, generation)) {
        return;
      }

      setRunState({ kind: "golden", result });
    } catch (cause) {
      if (isStaleActionGeneration(actionGenerationRef, generation)) {
        return;
      }

      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (!isStaleActionGeneration(actionGenerationRef, generation)) {
        setLoadingAction(null);
      }
    }
  }, [
    actionGenerationRef,
    activeRunId,
    architectureDescription,
    hydratedSourceTexts,
    interviewAnswers,
    prioritiesRaw,
    reviewTier,
    setError,
    setLoadingAction,
    setRunState,
  ]);

  const loadGoldenFixture = useCallback(async () => {
    invalidateInFlightActions();
    setLoadingAction("fixture");
    setError(null);
    const generation = actionGenerationRef.current;

    try {
      const fixture = await getJson<{
        sourceTexts?: ClosedLoopReasoningSourceText[];
        declaredPriorities?: string[];
      }>("/api/proxy/v1/architecture-intelligence/golden-fixture");

      const sources = fixture.sourceTexts ?? [];

      if (isStaleActionGeneration(actionGenerationRef, generation)) {
        return;
      }

      setRunState(null);
      setInterviewAnswers({});
      setPublishToProduct(false);
      setHydratedSourceTexts(sources);
      setArchitectureDescription(primaryDescriptionFromSources(sources));
      setPrioritiesRaw((fixture.declaredPriorities ?? []).join(", "));
      markProductContextLoaded(sources.length > 0);
    } catch (cause) {
      if (isStaleActionGeneration(actionGenerationRef, generation)) {
        return;
      }

      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (!isStaleActionGeneration(actionGenerationRef, generation)) {
        setLoadingAction(null);
      }
    }
  }, [
    actionGenerationRef,
    invalidateInFlightActions,
    markProductContextLoaded,
    setArchitectureDescription,
    setError,
    setHydratedSourceTexts,
    setInterviewAnswers,
    setLoadingAction,
    setPrioritiesRaw,
    setPublishToProduct,
    setRunState,
  ]);

  const isBusy = loadingAction !== null;

  return {
    isBusy,
    analyzeThisReview,
    runReasoning,
    runGoldenTest,
    loadGoldenFixture,
    publishRun,
    continueWithAnswers,
  };
}
