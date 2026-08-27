"use client";

import { useMemo } from "react";

import { architectureIntelligencePageSubtitle } from "@/lib/architecture/architecture-intelligence-page-copy";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";

import { flattenFindings } from "./architecture-intelligence-client-api";
import { useArchitectureIntelligenceActions } from "./use-architecture-intelligence-actions";
import { useArchitectureIntelligenceProductContext } from "./use-architecture-intelligence-product-context";
import type { ArchitectureIntelligenceReviewTier } from "@/lib/architecture/architecture-intelligence-review-tier";
import type {
  FramingQuestion,
  RunState,
  SpecialistReviewFinding,
} from "./architecture-intelligence-types";
import type { ArchitectureIntelligenceLoadingAction } from "./use-architecture-intelligence-product-context";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";

export type UseArchitectureIntelligencePageResult = {
  buyerPolishedShell: boolean;
  pageSubtitle: string;
  showProductContextSkeleton: boolean;
  loadingInboundContext: boolean;
  productContextLoadFailed: boolean;
  productContextLoadFailure: ApiLoadFailureState | null;
  loadingAction: ArchitectureIntelligenceLoadingAction;
  retryProductContextLoad: () => void;
  showReasoningWorkspace: boolean;
  showIntakeForm: boolean;
  inboundContextLine: string | null;
  activeRunId: string | null;
  onSelectReview: (reviewId: string) => void;
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
  const productContext = useArchitectureIntelligenceProductContext();
  const actions = useArchitectureIntelligenceActions(productContext);
  const { blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();

  const findings = useMemo(() => {
    if (productContext.runState?.kind !== "reasoning") {
      return [];
    }

    return flattenFindings(productContext.runState.result);
  }, [productContext.runState]);

  const interviewQuestions = useMemo(() => {
    if (productContext.runState?.kind !== "reasoning") {
      return [] as FramingQuestion[];
    }

    const framing = productContext.runState.result.interview?.framingQuestions ?? [];
    const evidence = productContext.runState.result.interview?.evidenceDrivenQuestions ?? [];

    return [...framing, ...evidence];
  }, [productContext.runState]);

  return {
    buyerPolishedShell: productContext.buyerPolishedShell,
    pageSubtitle: architectureIntelligencePageSubtitle(productContext.buyerPolishedShell),
    showProductContextSkeleton: productContext.showProductContextSkeleton,
    loadingInboundContext: productContext.loadingInboundContext,
    productContextLoadFailed: productContext.productContextLoadFailed,
    productContextLoadFailure: productContext.productContextLoadFailure,
    loadingAction: productContext.loadingAction,
    retryProductContextLoad: productContext.retryProductContextLoad,
    showReasoningWorkspace: productContext.showReasoningWorkspace,
    showIntakeForm: productContext.showIntakeForm,
    inboundContextLine: productContext.inboundContextLine,
    activeRunId: productContext.activeRunId,
    onSelectReview: productContext.onSelectReview,
    architectureDescription: productContext.architectureDescription,
    setArchitectureDescription: productContext.setArchitectureDescription,
    prioritiesRaw: productContext.prioritiesRaw,
    setPrioritiesRaw: productContext.setPrioritiesRaw,
    reviewTier: productContext.reviewTier,
    setReviewTierIfValid: productContext.setReviewTierIfValid,
    reviewTiers: productContext.reviewTiers,
    reviewTierLabel: productContext.reviewTierLabel,
    isBusy: actions.isBusy,
    blocksLlmExecution,
    canAnalyzeHydratedReview: productContext.canAnalyzeHydratedReview,
    analyzeThisReview: actions.analyzeThisReview,
    runReasoning: actions.runReasoning,
    runGoldenTest: actions.runGoldenTest,
    loadGoldenFixture: actions.loadGoldenFixture,
    publishRun: actions.publishRun,
    publishToProduct: productContext.publishToProduct,
    setPublishToProduct: productContext.setPublishToProduct,
    error: productContext.error,
    runState: productContext.runState,
    findings,
    interviewQuestions,
    interviewAnswers: productContext.interviewAnswers,
    onInterviewAnswerChange: productContext.onInterviewAnswerChange,
    continueWithAnswers: actions.continueWithAnswers,
  };
}
