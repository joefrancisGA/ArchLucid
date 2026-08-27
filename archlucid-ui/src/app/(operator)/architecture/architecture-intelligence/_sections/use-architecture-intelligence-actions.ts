"use client";

import { useCallback } from "react";

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
    setActiveRunId,
    setHydratedSourceTexts,
    setArchitectureDescription,
    setPrioritiesRaw,
    markProductContextLoaded,
    loadingAction,
  } = ctx;

  const runReasoningWithOptions = useCallback(
    async (options?: { publish?: boolean; action?: "reasoning" | "analyze" }) => {
      if (architectureDescription.trim().length === 0) {
        setError("Architecture description is required (or load the golden fixture).");

        return;
      }

      const shouldPublish = options?.publish ?? publishToProduct;
      const action = options?.action ?? "reasoning";

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

        setActiveRunId(result.runId ?? null);
        setRunState({ kind: "reasoning", result });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setLoadingAction(null);
      }
    },
    [
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

      setActiveRunId(result.runId ?? activeRunId);
      setRunState({ kind: "reasoning", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [
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

      setRunState({ kind: "reasoning", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [
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

      setRunState({ kind: "golden", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [
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
    setLoadingAction("fixture");
    setError(null);

    try {
      const fixture = await getJson<{
        sourceTexts?: ClosedLoopReasoningSourceText[];
        declaredPriorities?: string[];
      }>("/api/proxy/v1/architecture-intelligence/golden-fixture");

      const sources = fixture.sourceTexts ?? [];
      setHydratedSourceTexts(sources);
      setArchitectureDescription(primaryDescriptionFromSources(sources));
      setPrioritiesRaw((fixture.declaredPriorities ?? []).join(", "));
      markProductContextLoaded(sources.length > 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [
    markProductContextLoaded,
    setArchitectureDescription,
    setError,
    setHydratedSourceTexts,
    setLoadingAction,
    setPrioritiesRaw,
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
