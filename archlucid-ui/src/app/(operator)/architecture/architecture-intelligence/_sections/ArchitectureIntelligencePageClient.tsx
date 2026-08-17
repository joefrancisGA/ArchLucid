"use client";

import { Brain } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ArchitectureIntelligenceBreadcrumb } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceBreadcrumb";
import { ArchitectureIntelligenceBuyerChrome } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceBuyerChrome";
import { ArchitectureIntelligenceGoldenResults } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceGoldenResults";
import { ArchitectureIntelligencePageSkeleton } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligencePageSkeleton";
import { ArchitectureIntelligenceProductContextLoadFailure } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceProductContextLoadFailure";
import { ArchitectureIntelligenceReasoningResults } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceReasoningResults";
import {
  buildRequest,
  flattenFindings,
  getJson,
  postJson,
  primaryDescriptionFromSources,
} from "@/app/(operator)/architecture/architecture-intelligence/_sections/architecture-intelligence-client-api";
import type {
  ClosedLoopReasoningResult,
  ClosedLoopReasoningSourceText,
  FramingQuestion,
  GoldenArchitectureTestResult,
  RunState,
  SpecialistReviewFinding,
} from "@/app/(operator)/architecture/architecture-intelligence/_sections/architecture-intelligence-types";
import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { ArchitectureIntelligenceEvidenceGraphVocabularyRail } from "@/components/ArchitectureIntelligenceEvidenceGraphVocabularyRail";
import { AskArchitectureIntelligenceVocabularyRail } from "@/components/AskArchitectureIntelligenceVocabularyRail";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import {
  ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS,
  architectureIntelligenceReviewTierLabel,
  isArchitectureIntelligenceReviewTier,
  type ArchitectureIntelligenceReviewTier,
} from "@/lib/architecture/architecture-intelligence-review-tier";
import {
  ARCHITECTURE_INTELLIGENCE_ACTIVE_RUN_LABEL,
  ARCHITECTURE_INTELLIGENCE_PAGE_TITLE,
  ARCHITECTURE_INTELLIGENCE_PRODUCT_CONTEXT_RETRY_LABEL,
  ARCHITECTURE_INTELLIGENCE_PUBLISH_TOGGLE_LABEL,
  architectureIntelligencePageSubtitle,
} from "@/lib/architecture/architecture-intelligence-page-copy";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function ArchitectureIntelligencePageClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const searchParams = useSearchParams();
  const inboundRunId = searchParams.get("runId")?.trim() ?? "";
  const inboundFrom = searchParams.get("from")?.trim() ?? "";
  const { blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();

  const [architectureDescription, setArchitectureDescription] = useState("");
  const [prioritiesRaw, setPrioritiesRaw] = useState("");
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [hydratedSourceTexts, setHydratedSourceTexts] = useState<ClosedLoopReasoningSourceText[]>([]);
  const [productContextStatus, setProductContextStatus] = useState<
    "idle" | "loading" | "loaded" | "empty" | "error"
  >("idle");
  const [productContextReloadNonce, setProductContextReloadNonce] = useState(0);
  const [publishToProduct, setPublishToProduct] = useState(false);
  const [reviewTier, setReviewTier] = useState<ArchitectureIntelligenceReviewTier>("Standard");
  const [loadingAction, setLoadingAction] = useState<
    "reasoning" | "analyze" | "golden" | "fixture" | "continue" | "publish" | "product-context" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);

  const canAnalyzeHydratedReview =
    productContextStatus === "loaded" &&
    (activeRunId?.trim().length ?? 0) > 0 &&
    architectureDescription.trim().length > 0;
  const loadingInboundContext = inboundRunId.length > 0 && productContextStatus === "loading";
  const productContextLoadFailed = inboundRunId.length > 0 && productContextStatus === "error";
  const showIntakeForm = !loadingInboundContext && !productContextLoadFailed;

  useEffect(() => {
    if (inboundRunId.length === 0) {
      return;
    }

    setActiveRunId(inboundRunId);
    setProductContextStatus("loading");
    setLoadingAction("product-context");
    setError(null);

    let canceled = false;

    void (async () => {
      try {
        const context = await getJson<{
          runId?: string | null;
          sourceTexts?: ClosedLoopReasoningSourceText[];
          declaredPriorities?: string[];
        }>(
          `/api/proxy/v1/architecture-intelligence/product-runs/${encodeURIComponent(inboundRunId)}/source-context`,
        );

        if (canceled) {
          return;
        }

        const sources = context.sourceTexts ?? [];
        setHydratedSourceTexts(sources);
        setArchitectureDescription(primaryDescriptionFromSources(sources));
        setActiveRunId(context.runId?.trim() || inboundRunId);

        if ((context.declaredPriorities?.length ?? 0) > 0) {
          setPrioritiesRaw((context.declaredPriorities ?? []).join(", "));
        }

        setProductContextStatus(sources.length > 0 ? "loaded" : "empty");
      } catch (cause) {
        if (canceled) {
          return;
        }

        setProductContextStatus("error");
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load product run source context. Paste a description or load the golden fixture.",
        );
      } finally {
        if (!canceled) {
          setLoadingAction(null);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [inboundRunId, productContextReloadNonce]);

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
          ? `Loaded product intake from governance findings for this review${extra}. Run reasoning, then publish gated findings back to this review.`
          : `Loaded product intake from governance findings for run ${inboundRunId}${extra}. Run reasoning, then publish gated findings back to this review.`;
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

    if (inboundFrom === "findings") {
      return buyerPolishedShell
        ? "Opened from governance findings for this review. Load failed or empty — paste a description or use the golden fixture."
        : `Opened from governance findings for run ${inboundRunId}. Load failed or empty — paste a description or use the golden fixture.`;
    }

    if (inboundFrom === "reviews") {
      return buyerPolishedShell
        ? "Opened from this review. Load failed or empty — paste a description or use the golden fixture."
        : `Opened from review ${inboundRunId}. Load failed or empty — paste a description or use the golden fixture.`;
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

  const runReasoning = useCallback(
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

  const analyzeThisReview = useCallback(async () => {
    if (!canAnalyzeHydratedReview) {
      setError("Load a product review intake before analyzing this review.");

      return;
    }

    await runReasoning({ publish: true, action: "analyze" });
  }, [canAnalyzeHydratedReview, runReasoning]);

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

  const retryProductContextLoad = useCallback(() => {
    setProductContextReloadNonce((previous) => previous + 1);
  }, []);

  const isBusy = loadingAction !== null;

  return (
    <div
      className={cn("w-full", buyerPolishedShell ? "max-w-6xl" : "max-w-3xl", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="architecture-intelligence-page"
    >
      <OperatorPageHeader
        navHref={ARCHITECTURE_INTELLIGENCE_PATH}
        // Not a nav destination, so nav-config cannot resolve the header icon.
        icon={Brain}
        title={ARCHITECTURE_INTELLIGENCE_PAGE_TITLE}
        subtitle={architectureIntelligencePageSubtitle(buyerPolishedShell)}
        titleTestId="architecture-intelligence-page-title"
        breadcrumb={buyerPolishedShell ? <ArchitectureIntelligenceBreadcrumb /> : undefined}
        actions={<PageContextualHelpButton />}
      />

      <ArchitectureIntelligenceBuyerChrome />

      {!buyerPolishedShell ? (
        <>
          <PageCapabilityBoundaryStrip surfaceId="architectureIntelligence" />
          <AskArchitectureIntelligenceVocabularyRail currentSurfaceId="architecture-intelligence" />
          <ArchitectureIntelligenceEvidenceGraphVocabularyRail currentSurfaceId="architecture-intelligence" />
        </>
      ) : null}

      {inboundContextLine ? (
        <p
          className={cn(OPERATOR_TYPOGRAPHY.body, "text-muted-foreground")}
          data-testid="architecture-intelligence-inbound-context"
        >
          {inboundContextLine}
        </p>
      ) : null}

      {loadingInboundContext ? <ArchitectureIntelligencePageSkeleton /> : null}

      {productContextLoadFailed ? (
        <ArchitectureIntelligenceProductContextLoadFailure
          message={
            error ??
            "Could not load product run source context. Paste a description or use the golden fixture."
          }
          retryLabel={ARCHITECTURE_INTELLIGENCE_PRODUCT_CONTEXT_RETRY_LABEL}
          retryDisabled={isBusy}
          onRetry={retryProductContextLoad}
        />
      ) : null}

      {activeRunId && !loadingInboundContext ? (
        <p
          className={cn(OPERATOR_TYPOGRAPHY.helper, !buyerPolishedShell ? "font-mono" : undefined)}
          data-testid="architecture-intelligence-active-run"
        >
          {buyerPolishedShell ? ARCHITECTURE_INTELLIGENCE_ACTIVE_RUN_LABEL : "Active run"}:{" "}
          <TechnicalIdDisclosure label="" value={activeRunId} />
        </p>
      ) : null}

      {showIntakeForm ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="architecture-description">Architecture description</Label>
            <Textarea
              id="architecture-description"
              data-testid="architecture-intelligence-description"
              value={architectureDescription}
              onChange={(event) => setArchitectureDescription(event.target.value)}
              rows={10}
              placeholder="Describe components, data flows, quality goals, and constraints…"
              disabled={isBusy}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="architecture-priorities">Declared priorities (optional, comma-separated)</Label>
            <Input
              id="architecture-priorities"
              data-testid="architecture-intelligence-priorities"
              value={prioritiesRaw}
              onChange={(event) => setPrioritiesRaw(event.target.value)}
              placeholder="security, reliability, cost"
              disabled={isBusy}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="architecture-review-tier">Analysis depth</Label>
            <select
              id="architecture-review-tier"
              data-testid="architecture-intelligence-review-tier"
              className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={reviewTier}
              disabled={isBusy}
              onChange={(event) => {
                const next = event.target.value;

                if (isArchitectureIntelligenceReviewTier(next)) {
                  setReviewTier(next);
                }
              }}
            >
              {ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {architectureIntelligenceReviewTierLabel(tier)}
                </option>
              ))}
            </select>
            <p className={cn(OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-intelligence-depth-hint">
              Deeper analysis runs more specialist roles and accepts larger sources, so it costs more.
            </p>
          </div>

          <AiBudgetSpendNotice
            action="Architecture reasoning"
            testId="architecture-intelligence-budget-notice"
          />

          <div className="flex flex-wrap gap-2" id="architecture-intelligence-actions">
            {canAnalyzeHydratedReview ? (
              <Button
                type="button"
                data-testid="architecture-intelligence-analyze-review-button"
                disabled={isBusy || blocksLlmExecution}
                onClick={() => void analyzeThisReview()}
              >
                {loadingAction === "analyze"
                  ? "Analyzing and publishing…"
                  : "Analyze this review"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant={canAnalyzeHydratedReview ? "outline" : "primary"}
              data-testid="architecture-intelligence-run-button"
              disabled={isBusy || blocksLlmExecution}
              onClick={() => void runReasoning()}
            >
              {loadingAction === "reasoning" ? "Running architecture reasoning…" : "Run architecture reasoning"}
            </Button>
            <Button
              type="button"
              variant="outline"
              data-testid="architecture-intelligence-golden-test-button"
              disabled={isBusy || blocksLlmExecution}
              onClick={() => void runGoldenTest()}
            >
              {loadingAction === "golden" ? "Running golden test…" : "Run golden test"}
            </Button>
            <Button
              type="button"
              variant="outline"
              data-testid="architecture-intelligence-load-fixture-button"
              disabled={isBusy}
              onClick={() => void loadGoldenFixture()}
            >
              {loadingAction === "fixture" ? "Loading fixture…" : "Load golden fixture"}
            </Button>
            <Button
              type="button"
              variant="outline"
              data-testid="architecture-intelligence-publish-button"
              disabled={isBusy || activeRunId === null || blocksLlmExecution}
              onClick={() => void publishRun()}
            >
              {loadingAction === "publish" ? "Publishing…" : "Publish to findings/advisory"}
            </Button>
          </div>

          <label className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
            <input
              type="checkbox"
              data-testid="architecture-intelligence-publish-toggle"
              checked={publishToProduct}
              disabled={isBusy}
              onChange={(event) => setPublishToProduct(event.target.checked)}
            />
            {ARCHITECTURE_INTELLIGENCE_PUBLISH_TOGGLE_LABEL}
          </label>
          {canAnalyzeHydratedReview ? (
            <p className={cn(OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-intelligence-analyze-hint">
              Analyze this review runs closed-loop reasoning for the hydrated product run and publishes gated
              output into findings/advisory.
            </p>
          ) : null}
        </div>
      ) : null}

      {error !== null && !productContextLoadFailed ? (
        <p
          role="alert"
          data-testid="architecture-intelligence-error"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary dark:border-rose-800/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {error}
        </p>
      ) : null}

      {runState?.kind === "reasoning" ? (
        <ArchitectureIntelligenceReasoningResults
          result={runState.result}
          findings={findings}
          interviewQuestions={interviewQuestions}
          interviewAnswers={interviewAnswers}
          onInterviewAnswerChange={(questionId, value) =>
            setInterviewAnswers((previous) => ({ ...previous, [questionId]: value }))
          }
          onResubmitAnswers={() => void continueWithAnswers()}
          isBusy={isBusy}
        />
      ) : null}

      {runState?.kind === "golden" ? <ArchitectureIntelligenceGoldenResults result={runState.result} /> : null}
    </div>
  );
}
