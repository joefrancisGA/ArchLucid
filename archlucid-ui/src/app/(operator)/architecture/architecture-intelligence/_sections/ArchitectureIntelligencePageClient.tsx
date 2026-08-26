"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { ArchitectureIntelligenceBuyerChrome } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceBuyerChrome";
import { ArchitectureIntelligenceGoldenResults } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceGoldenResults";
import { ArchitectureIntelligencePageHeader } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligencePageHeader";
import { ArchitectureIntelligencePageSkeleton } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligencePageSkeleton";
import { ArchitectureIntelligenceProductContextLoadFailure } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceProductContextLoadFailure";
import { ArchitectureIntelligenceReasoningResults } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceReasoningResults";
import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { ArchitectureIntelligenceAnalysisDepthSelect } from "@/components/architecture-intelligence/ArchitectureIntelligenceAnalysisDepthSelect";
import { ArchitectureIntelligenceEvidenceGraphVocabularyRail } from "@/components/ArchitectureIntelligenceEvidenceGraphVocabularyRail";
import { AskArchitectureIntelligenceVocabularyRail } from "@/components/AskArchitectureIntelligenceVocabularyRail";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import {
  ARCHITECTURE_INTELLIGENCE_ACTIVE_RUN_LABEL,
  ARCHITECTURE_INTELLIGENCE_PRODUCT_CONTEXT_RETRY_LABEL,
  ARCHITECTURE_INTELLIGENCE_PUBLISH_TOGGLE_LABEL,
} from "@/lib/architecture/architecture-intelligence-page-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { ArchitectureIntelligencePickReviewBeforeAnalysisStrip } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligencePickReviewBeforeAnalysisStrip";
import { ArchitectureIntelligenceNextReviewFooterClient } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceNextReviewFooterClient";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import {
  resolveArchitectureIntelligenceAnalysisEmphasizedStepId,
  resolveArchitectureIntelligenceAnalysisSteps,
} from "@/lib/architecture-intelligence-analysis-checklist";
import { useArchitectureIntelligencePage } from "./use-architecture-intelligence-page";

export function ArchitectureIntelligencePageClient() {
  const {
    buyerPolishedShell,
    pageSubtitle,
    loadingInboundContext,
    productContextLoadFailed,
    loadingAction,
    retryProductContextLoad,
    showIntakeForm,
    inboundContextLine,
    activeRunId,
    onSelectReview,
    architectureDescription,
    setArchitectureDescription,
    prioritiesRaw,
    setPrioritiesRaw,
    reviewTier,
    setReviewTierIfValid,
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
  } = useArchitectureIntelligencePage();

  const reviewPicked = (activeRunId?.trim() ?? "").length > 0;
  const descriptionWritten = architectureDescription.trim().length > 0;
  const analysisComplete = runState?.kind === "reasoning";
  const analysisChecklistInput = {
    reviewPicked,
    descriptionWritten,
    analysisComplete,
  };
  const analysisSteps = resolveArchitectureIntelligenceAnalysisSteps(analysisChecklistInput);
  const analysisEmphasizedStepId =
    resolveArchitectureIntelligenceAnalysisEmphasizedStepId(analysisChecklistInput);

  return (
    <OperatorPageContainer
      variant={buyerPolishedShell ? "workflow" : "reading"}
      className={OPERATOR_LAYOUT.majorSectionGap}
      data-testid="architecture-intelligence-page"
    >
      <ArchitectureIntelligencePageHeader subtitle={pageSubtitle} />

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
          {(activeRunId?.trim() ?? "").length === 0 ? (
            <ArchitectureIntelligencePickReviewBeforeAnalysisStrip
              selectedReviewId={activeRunId ?? ""}
              onSelectReview={onSelectReview}
            />
          ) : null}
          <IntegrationConnectChecklist
            title="Analysis checklist"
            steps={analysisSteps}
            emphasizedStepId={analysisEmphasizedStepId}
            testIdPrefix="architecture-intelligence-analysis"
          />
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

          <ArchitectureIntelligenceAnalysisDepthSelect
            id="architecture-review-tier"
            testId="architecture-intelligence-review-tier"
            value={reviewTier}
            disabled={isBusy}
            onValueChange={setReviewTierIfValid}
          />
          <p className={cn(OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-intelligence-depth-hint">
            Deeper analysis runs more specialist roles and accepts larger sources, so it costs more.
          </p>

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
                {loadingAction === "analyze" ? "Analyzing and publishing…" : "Analyze this review"}
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
          onInterviewAnswerChange={onInterviewAnswerChange}
          onResubmitAnswers={() => void continueWithAnswers()}
          isBusy={isBusy}
        />
      ) : null}

      {runState?.kind === "golden" ? <ArchitectureIntelligenceGoldenResults result={runState.result} /> : null}

      {(activeRunId?.trim() ?? "").length > 0 ? (
        <ArchitectureIntelligenceNextReviewFooterClient runId={activeRunId?.trim() ?? ""} />
      ) : null}
    </OperatorPageContainer>
  );
}
