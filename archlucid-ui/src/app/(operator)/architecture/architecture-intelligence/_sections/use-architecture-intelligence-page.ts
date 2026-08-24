"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS,
  architectureIntelligenceReviewTierLabel,
  isArchitectureIntelligenceReviewTier,
  type ArchitectureIntelligenceReviewTier,
} from "@/lib/architecture/architecture-intelligence-review-tier";
import { architectureIntelligencePageSubtitle } from "@/lib/architecture/architecture-intelligence-page-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { useArchitectureIntelligenceSourceContextQuery } from "@/hooks/use-architecture-intelligence-source-context-query";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";

import {
  buildRequest,
  flattenFindings,
  getJson,
  postJson,
  primaryDescriptionFromSources,
} from "./architecture-intelligence-client-api";
import { architectureIntelligenceErrorToLoadFailure } from "./architecture-intelligence-page-helpers";
import type {
  ClosedLoopReasoningResult,
  ClosedLoopReasoningSourceText,
  FramingQuestion,
  GoldenArchitectureTestResult,
  RunState,
  SpecialistReviewFinding,
} from "./architecture-intelligence-types";

type ProductContextStatus = "idle" | "loading" | "loaded" | "empty" | "error";
type LoadingAction =
  | "reasoning"
  | "analyze"
  | "golden"
  | "fixture"
  | "continue"
  | "publish"
  | "product-context"
  | null;

export type UseArchitectureIntelligencePageResult = {
  buyerPolishedShell: boolean;
  pageSubtitle: string;
  showProductContextSkeleton: boolean;
  loadingInboundContext: boolean;
  productContextLoadFailed: boolean;
  productContextLoadFailure: ApiLoadFailureState | null;
  loadingAction: LoadingAction;
  retryProductContextLoad: () => void;
  showReasoningWorkspace: boolean;
  showIntakeForm: boolean;
  inboundContextLine: string | null;
  activeRunId: string | null;
  architectureDescription: string;
  setArchitectureDescription: (value: string) => void;
  prioritiesRaw: string;
  setPrioritiesRaw: (value: string) => void;
  reviewTier: ArchitectureIntelligenceReviewTier;
  setReviewTierIfValid: (value: string) => void;
  reviewTiers: readonly ArchitectureIntelligenceReviewTier[];
  reviewTierLabel: (tier: ArchitectureIntelligenceReviewTier) => string;
  isBusy: boolean;
  blocksLlmExecution: boolean;
  canAnalyzeHydratedReview: boolean;
  analyzeThisReview: () => Promise<void>;
  runReasoning: () => Promise<void>;
  runGoldenTest: () => Promise<void>;
  loadGoldenFixture: () => Promise<void>;
  publishRun: () => Promise<void>;
  publishToProduct: boolean;
  setPublishToProduct: (value: boolean) => void;
  error: string | null;
  runState: RunState | null;
  findings: SpecialistReviewFinding[];
  interviewQuestions: FramingQuestion[];
  interviewAnswers: Record<string, string>;
  onInterviewAnswerChange: (questionId: string, value: string) => void;
  continueWithAnswers: () => Promise<void>;
};

export function useArchitectureIntelligencePage(): UseArchitectureIntelligencePageResult {
  const searchParams = useSearchParams();
  const inboundRunId = searchParams.get("runId")?.trim() ?? "";
  const inboundFrom = searchParams.get("from")?.trim() ?? "";
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const scope = useOperatorScopeQueryKey();
  const scopeKey = `${scope.tenantId}:${scope.workspaceId}:${scope.projectId}`;
  const previousScopeKeyRef = useRef(scopeKey);
  const [productContextReloadNonce, setProductContextReloadNonce] = useState(0);
  const sourceContextQuery = useArchitectureIntelligenceSourceContextQuery(inboundRunId, {
    enabled: inboundRunId.length > 0,
  });
  const hydratedDescriptionFromQuery = useMemo(
    () => primaryDescriptionFromSources(sourceContextQuery.data?.sourceTexts ?? []),
    [sourceContextQuery.data?.sourceTexts],
  );
  const hydratedPrioritiesFromQuery = useMemo(
    () => (sourceContextQuery.data?.declaredPriorities ?? []).join(", "),
    [sourceContextQuery.data?.declaredPriorities],
  );

  const [architectureDescription, setArchitectureDescription] = useState("");
  const [prioritiesRaw, setPrioritiesRaw] = useState("");
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [hydratedSourceTexts, setHydratedSourceTexts] = useState<ClosedLoopReasoningSourceText[]>([]);
  const [productContextStatus, setProductContextStatus] = useState<ProductContextStatus>("idle");
  const [publishToProduct, setPublishToProduct] = useState(false);
  const [reviewTier, setReviewTier] = useState<ArchitectureIntelligenceReviewTier>("Standard");
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);

  const canAnalyzeHydratedReview =
    productContextStatus === "loaded" &&
    (activeRunId?.trim().length ?? 0) > 0 &&
    architectureDescription.trim().length > 0;

  const retryProductContextLoad = useCallback(() => {
    setProductContextReloadNonce((previous) => previous + 1);
    void sourceContextQuery.refetch();
  }, [sourceContextQuery]);

  const setReviewTierIfValid = useCallback((value: string) => {
    if (isArchitectureIntelligenceReviewTier(value)) {
      setReviewTier(value);
    }
  }, []);

  const onInterviewAnswerChange = useCallback((questionId: string, value: string) => {
    setInterviewAnswers((previous) => ({ ...previous, [questionId]: value }));
  }, []);

  useEffect(() => {
    if (previousScopeKeyRef.current === scopeKey) {
      return;
    }

    previousScopeKeyRef.current = scopeKey;

    // Drop prior-tenant reasoning/intake when the operator switches workspace scope.
    setRunState(null);
    setInterviewAnswers({});
    setError(null);
    setArchitectureDescription("");
    setPrioritiesRaw("");
    setHydratedSourceTexts([]);
    setPublishToProduct(false);
    setLoadingAction(null);

    if (inboundRunId.length === 0) {
      setActiveRunId(null);
      setProductContextStatus("idle");

      return;
    }

    setProductContextReloadNonce((previous) => previous + 1);
  }, [scopeKey, inboundRunId]);

  useEffect(() => {
    if (inboundRunId.length === 0) {
      return;
    }

    // Prior run's findings/recommendations must not ride along when the deep-linked review changes.
    setRunState(null);
    setInterviewAnswers({});
    setActiveRunId(inboundRunId);
    setError(null);
  }, [inboundRunId, productContextReloadNonce]);

  useEffect(() => {
    if (inboundRunId.length === 0 || sourceContextQuery.data === undefined) {
      return;
    }

    const sources = sourceContextQuery.data.sourceTexts;
    setHydratedSourceTexts([...sources]);
    setArchitectureDescription(hydratedDescriptionFromQuery);
    setActiveRunId(sourceContextQuery.data.runId?.trim() || inboundRunId);

    if ((sourceContextQuery.data.declaredPriorities?.length ?? 0) > 0) {
      setPrioritiesRaw(hydratedPrioritiesFromQuery);
    }

    setProductContextStatus(sources.length > 0 ? "loaded" : "empty");
    setLoadingAction(null);
  }, [
    hydratedDescriptionFromQuery,
    hydratedPrioritiesFromQuery,
    inboundRunId,
    productContextReloadNonce,
    sourceContextQuery.data,
  ]);

  useEffect(() => {
    if (inboundRunId.length === 0) {
      return;
    }

    if (sourceContextQuery.isPending) {
      setProductContextStatus("loading");
      setLoadingAction("product-context");
      return;
    }

    if (sourceContextQuery.isError) {
      setProductContextStatus("error");
      setLoadingAction(null);
      setError(
        sourceContextQuery.error instanceof Error
          ? sourceContextQuery.error.message
          : "Could not load product run source context. Paste a description or load the golden fixture.",
      );
    }
  }, [inboundRunId, sourceContextQuery.error, sourceContextQuery.isError, sourceContextQuery.isPending]);

  const loadingInboundContext = inboundRunId.length > 0 && productContextStatus === "loading";
  const productContextLoadFailed = inboundRunId.length > 0 && productContextStatus === "error";
  const showIntakeForm = !loadingInboundContext && !productContextLoadFailed;

  const productContextLoadFailure =
    productContextLoadFailed && error !== null
      ? architectureIntelligenceErrorToLoadFailure(error)
      : null;

  const showProductContextSkeleton = loadingInboundContext;

  const showReasoningWorkspace =
    inboundRunId.length === 0 || (productContextStatus !== "loading" && productContextStatus !== "error");

  const inboundContextLine = useMemo(() => {
    if (inboundRunId.length === 0) {
      return null;
    }

    if (productContextStatus === "loading") {
      return buyerPolishedShell
        ? "Loading architecture intake for this review…"
        : `Loading architecture intake for run ${inboundRunId}…`;
    }

    if (productContextStatus === "loaded") {
      const extraCount = Math.max(0, hydratedSourceTexts.length - 1);
      const extra =
        extraCount > 0 ? ` plus ${extraCount} attached document${extraCount === 1 ? "" : "s"}` : "";

      if (inboundFrom === "findings") {
        return buyerPolishedShell
          ? `Loaded product intake from the findings queue for this review${extra}. Run reasoning, then publish gated findings back to this review.`
          : `Loaded product intake from the findings queue for run ${inboundRunId}${extra}. Run reasoning, then publish gated findings back to this review.`;
      }

      if (inboundFrom === "reviews") {
        return buyerPolishedShell
          ? `Loaded product intake from this review${extra}. Run closed-loop reasoning, then publish gated findings into the product path.`
          : `Loaded product intake from review ${inboundRunId}${extra}. Run closed-loop reasoning, then publish gated findings into the product path.`;
      }

      return buyerPolishedShell
        ? `Loaded product intake for this review${extra}.`
        : `Loaded product intake for run ${inboundRunId}${extra}.`;
    }

    if (productContextStatus === "empty") {
      if (inboundFrom === "findings") {
        return buyerPolishedShell
          ? "Opened from the findings queue for this review. Load failed or empty — paste a description or use the golden fixture."
          : `Opened from the findings queue for run ${inboundRunId}. Load failed or empty — paste a description or use the golden fixture.`;
      }

      if (inboundFrom === "reviews") {
        return buyerPolishedShell
          ? "Opened from this review. Load failed or empty — paste a description or use the golden fixture."
          : `Opened from review ${inboundRunId}. Load failed or empty — paste a description or use the golden fixture.`;
      }

      return buyerPolishedShell
        ? "Opened with no architecture intake for this review — paste a description or use the golden fixture."
        : `Opened for run ${inboundRunId} with no architecture intake — paste a description or use the golden fixture.`;
    }

    if (productContextStatus === "error") {
      if (inboundFrom === "findings") {
        return buyerPolishedShell
          ? "Opened from the findings queue for this review. Load failed or empty — paste a description or use the golden fixture."
          : `Opened from the findings queue for run ${inboundRunId}. Load failed or empty — paste a description or use the golden fixture.`;
      }

      if (inboundFrom === "reviews") {
        return buyerPolishedShell
          ? "Opened from this review. Load failed or empty — paste a description or use the golden fixture."
          : `Opened from review ${inboundRunId}. Load failed or empty — paste a description or use the golden fixture.`;
      }

      return buyerPolishedShell
        ? "Could not load architecture intake for this review — paste a description or use the golden fixture."
        : `Could not load architecture intake for run ${inboundRunId} — paste a description or use the golden fixture.`;
    }

    return buyerPolishedShell ? "Scoped to this review." : `Scoped to run ${inboundRunId}.`;
  }, [buyerPolishedShell, inboundFrom, inboundRunId, productContextStatus, hydratedSourceTexts.length]);

  const findings = useMemo(() => {
    if (runState?.kind !== "reasoning") {
      return [];
    }

    return flattenFindings(runState.result);
  }, [runState]);

  const interviewQuestions = useMemo(() => {
    if (runState?.kind !== "reasoning") {
      return [] as FramingQuestion[];
    }

    const framing = runState.result.interview?.framingQuestions ?? [];
    const evidence = runState.result.interview?.evidenceDrivenQuestions ?? [];

    return [...framing, ...evidence];
  }, [runState]);

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
      architectureDescription,
      prioritiesRaw,
      interviewAnswers,
      publishToProduct,
      activeRunId,
      hydratedSourceTexts,
      reviewTier,
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
  }, [canAnalyzeHydratedReview, runReasoningWithOptions]);

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
    prioritiesRaw,
    interviewAnswers,
    publishToProduct,
    hydratedSourceTexts,
    reviewTier,
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
  }, [activeRunId, architectureDescription, prioritiesRaw, interviewAnswers, hydratedSourceTexts, reviewTier]);

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
  }, [architectureDescription, prioritiesRaw, interviewAnswers, hydratedSourceTexts, activeRunId, reviewTier]);

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
      setProductContextStatus("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, []);

  const isBusy = loadingAction !== null;

  return {
    buyerPolishedShell,
    pageSubtitle: architectureIntelligencePageSubtitle(buyerPolishedShell),
    showProductContextSkeleton,
    loadingInboundContext,
    productContextLoadFailed,
    productContextLoadFailure,
    loadingAction,
    retryProductContextLoad,
    showReasoningWorkspace,
    showIntakeForm,
    inboundContextLine,
    activeRunId,
    architectureDescription,
    setArchitectureDescription,
    prioritiesRaw,
    setPrioritiesRaw,
    reviewTier,
    setReviewTierIfValid,
    reviewTiers: ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS,
    reviewTierLabel: architectureIntelligenceReviewTierLabel,
    isBusy,
    blocksLlmExecution,
    canAnalyzeHydratedReview,
    analyzeThisReview,
    runReasoning,
    runGoldenTest,
    loadGoldenFixture,
    publishRun,
    publishToProduct,
    setPublishToProduct,
    error,
    runState,
    findings,
    interviewQuestions,
    interviewAnswers,
    onInterviewAnswerChange,
    continueWithAnswers,
  };
}
