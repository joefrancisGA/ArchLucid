"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS,
  architectureIntelligenceReviewTierLabel,
  isArchitectureIntelligenceReviewTier,
  type ArchitectureIntelligenceReviewTier,
} from "@/lib/architecture/architecture-intelligence-review-tier";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { useArchitectureIntelligenceSourceContextQuery } from "@/hooks/use-architecture-intelligence-source-context-query";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";

import { primaryDescriptionFromSources } from "./architecture-intelligence-client-api";
import { architectureIntelligenceErrorToLoadFailure } from "./architecture-intelligence-page-helpers";
import type {
  ClosedLoopReasoningSourceText,
  FramingQuestion,
  RunState,
  SpecialistReviewFinding,
} from "./architecture-intelligence-types";

export type ArchitectureIntelligenceLoadingAction =
  | "reasoning"
  | "analyze"
  | "golden"
  | "fixture"
  | "continue"
  | "publish"
  | "product-context"
  | null;

type ProductContextStatus = "idle" | "loading" | "loaded" | "empty" | "error";

export type UseArchitectureIntelligenceProductContextResult = {
  buyerPolishedShell: boolean;
  inboundRunId: string;
  inboundFrom: string;
  architectureDescription: string;
  setArchitectureDescription: (value: string) => void;
  prioritiesRaw: string;
  setPrioritiesRaw: (value: string) => void;
  interviewAnswers: Record<string, string>;
  onInterviewAnswerChange: (questionId: string, value: string) => void;
  activeRunId: string | null;
  setActiveRunId: (value: string | null) => void;
  hydratedSourceTexts: ClosedLoopReasoningSourceText[];
  setHydratedSourceTexts: (value: ClosedLoopReasoningSourceText[]) => void;
  publishToProduct: boolean;
  setPublishToProduct: (value: boolean) => void;
  reviewTier: ArchitectureIntelligenceReviewTier;
  setReviewTierIfValid: (value: string) => void;
  reviewTiers: readonly ArchitectureIntelligenceReviewTier[];
  reviewTierLabel: (tier: ArchitectureIntelligenceReviewTier) => string;
  loadingAction: ArchitectureIntelligenceLoadingAction;
  setLoadingAction: (value: ArchitectureIntelligenceLoadingAction) => void;
  error: string | null;
  setError: (value: string | null) => void;
  runState: RunState | null;
  setRunState: (value: RunState | null) => void;
  markProductContextLoaded: (hasSources: boolean) => void;
  canAnalyzeHydratedReview: boolean;
  retryProductContextLoad: () => void;
  loadingInboundContext: boolean;
  productContextLoadFailed: boolean;
  productContextLoadFailure: ApiLoadFailureState | null;
  showProductContextSkeleton: boolean;
  showIntakeForm: boolean;
  showReasoningWorkspace: boolean;
  inboundContextLine: string | null;
  onSelectReview: (reviewId: string) => void;
};

export function useArchitectureIntelligenceProductContext(): UseArchitectureIntelligenceProductContextResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inboundRunId = searchParams.get("runId")?.trim() ?? "";
  const inboundFrom = searchParams.get("from")?.trim() ?? "";
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
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
  const [loadingAction, setLoadingAction] = useState<ArchitectureIntelligenceLoadingAction>(null);
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

  const onSelectReview = useCallback(
    (runId: string) => {
      const normalized = runId.trim();

      if (normalized.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", normalized);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const markProductContextLoaded = useCallback((hasSources: boolean) => {
    setProductContextStatus(hasSources ? "loaded" : "empty");
  }, []);

  return {
    buyerPolishedShell,
    inboundRunId,
    inboundFrom,
    architectureDescription,
    setArchitectureDescription,
    prioritiesRaw,
    setPrioritiesRaw,
    interviewAnswers,
    onInterviewAnswerChange,
    activeRunId,
    setActiveRunId,
    hydratedSourceTexts,
    setHydratedSourceTexts,
    publishToProduct,
    setPublishToProduct,
    reviewTier,
    setReviewTierIfValid,
    reviewTiers: ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS,
    reviewTierLabel: architectureIntelligenceReviewTierLabel,
    loadingAction,
    setLoadingAction,
    error,
    setError,
    runState,
    setRunState,
    markProductContextLoaded,
    canAnalyzeHydratedReview,
    retryProductContextLoad,
    loadingInboundContext,
    productContextLoadFailed,
    productContextLoadFailure,
    showProductContextSkeleton,
    showIntakeForm,
    showReasoningWorkspace,
    inboundContextLine,
    onSelectReview,
  };
}

// Re-export for consumers that need finding/question types from the page facade.
export type { FramingQuestion, SpecialistReviewFinding };
