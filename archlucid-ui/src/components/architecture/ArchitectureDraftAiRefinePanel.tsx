"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { ArchitectureIntelligenceAnalysisDepthSelect } from "@/components/architecture-intelligence/ArchitectureIntelligenceAnalysisDepthSelect";
import { ArchitectureIntelligenceFramingInterviewPanel } from "@/components/architecture-intelligence/ArchitectureIntelligenceFramingInterviewPanel";
import { ArchitectureIntelligenceRefineResultSummary } from "@/components/architecture-intelligence/ArchitectureIntelligenceRefineResultSummary";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { ARCHITECTURE_DRAFT_AI_REFINE_HEADING } from "@/lib/architecture/architecture-draft-ai-refine-copy";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import {
  buildArchitectureIntelligenceRunRequest,
  buildArchitectureIntelligenceSourcesFromDraftFields,
  continueArchitectureIntelligenceReasoning,
  primaryDescriptionFromSources,
  runArchitectureIntelligenceReasoning,
  type ClosedLoopReasoningResult,
} from "@/lib/architecture/architecture-intelligence-api";
import {
  ARCHITECTURE_FRAMING_SKIPPED_WARNING_DESCRIPTION,
  ARCHITECTURE_FRAMING_SKIPPED_WARNING_GO_BACK_LABEL,
  ARCHITECTURE_FRAMING_SKIPPED_WARNING_PROCEED_LABEL,
  ARCHITECTURE_FRAMING_SKIPPED_WARNING_TITLE,
  buildFramingAnswersPayload,
  collectOpenFramingInterviewQuestions,
  framingInterviewReadyToSubmit,
  hasSkippedFramingQuestions,
  isFramingIncompletePublishBlock,
  mergeFramingAnswerDefaults,
} from "@/lib/architecture/architecture-intelligence-framing-interview";
import type { ArchitectureIntelligenceReviewTier } from "@/lib/architecture/architecture-intelligence-review-tier";
import { buildArchitectureIntelligenceRunHref } from "@/lib/architecture/architecture-intelligence-run-href";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { whyDisabledLlmBudgetExhausted } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";

export type ArchitectureDraftAiRefinePanelProps = {
  readonly fields: ArchitectureDraftFieldState;
  readonly linkedReviewId?: string | null;
  readonly disabled?: boolean;
};

/**
 * Operator-initiated closed-loop refinement from the architecture draft workspace.
 * Uses live form fields as source text. Publishes into product stores only when a linked review exists.
 * First-class section — not nested under Advanced Options.
 */
export function ArchitectureDraftAiRefinePanel(props: ArchitectureDraftAiRefinePanelProps) {
  const { fields, linkedReviewId = null, disabled = false } = props;
  const { blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();

  const [reviewTier, setReviewTier] = useState<ArchitectureIntelligenceReviewTier>("Standard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClosedLoopReasoningResult | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [framingAnswers, setFramingAnswers] = useState<Record<string, string>>({});
  const [skippedFramingQuestionIds, setSkippedFramingQuestionIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [skippedFramingWarningOpen, setSkippedFramingWarningOpen] = useState(false);

  const hydratedSources = useMemo(
    () => buildArchitectureIntelligenceSourcesFromDraftFields(fields),
    [fields],
  );
  const architectureDescription = useMemo(
    () => primaryDescriptionFromSources(hydratedSources),
    [hydratedSources],
  );
  const canPublish = (linkedReviewId?.trim().length ?? 0) > 0;
  const canRefine =
    architectureDescription.trim().length > 0 &&
    !busy &&
    !disabled &&
    !blocksLlmExecution;

  const openFramingQuestions = useMemo(
    () => (result === null ? [] : collectOpenFramingInterviewQuestions(result)),
    [result],
  );

  const showFramingInterview =
    result !== null &&
    openFramingQuestions.length > 0 &&
    (result.publishBlocked === true || isFramingIncompletePublishBlock(result));

  useEffect(() => {
    if (!showFramingInterview) {
      return;
    }

    setFramingAnswers((current) => mergeFramingAnswerDefaults(openFramingQuestions, current));
    setSkippedFramingQuestionIds(new Set());
  }, [openFramingQuestions, showFramingInterview]);

  const canResubmitFramingAnswers = framingInterviewReadyToSubmit(
    openFramingQuestions,
    framingAnswers,
    skippedFramingQuestionIds,
  );

  const buildRunRequest = useCallback(
    (options?: { framingAnswers?: Record<string, string>; continueFromExistingRun?: boolean }) => {
      const runId = activeRunId ?? (canPublish ? linkedReviewId : result?.runId ?? null);

      return buildArchitectureIntelligenceRunRequest({
        architectureDescription,
        runId,
        hydratedSourceTexts: hydratedSources,
        publishToProduct: canPublish,
        reviewTier,
        framingAnswers: options?.framingAnswers ?? {},
        continueFromExistingRun: options?.continueFromExistingRun ?? false,
      });
    },
    [
      activeRunId,
      architectureDescription,
      canPublish,
      hydratedSources,
      linkedReviewId,
      result?.runId,
      reviewTier,
    ],
  );

  const applyReasoningResult = useCallback((next: ClosedLoopReasoningResult) => {
    setResult(next);
    setActiveRunId(next.runId?.trim() || null);
  }, []);

  const refine = useCallback(async () => {
    if (!canRefine) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const next = await runArchitectureIntelligenceReasoning(buildRunRequest());
      applyReasoningResult(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }, [applyReasoningResult, buildRunRequest, canRefine]);

  const resubmitFramingAnswers = useCallback(async () => {
    const runId = activeRunId ?? result?.runId?.trim() ?? linkedReviewId?.trim() ?? "";

    if (runId.length === 0) {
      setError("Run refine first to obtain a reasoning run id.");

      return;
    }

    if (!canResubmitFramingAnswers) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const payload = buildFramingAnswersPayload(
        openFramingQuestions,
        framingAnswers,
        skippedFramingQuestionIds,
      );
      const next = await continueArchitectureIntelligenceReasoning(
        runId,
        buildRunRequest({
          framingAnswers: payload,
          continueFromExistingRun: true,
        }),
      );

      applyReasoningResult(next);
      setSkippedFramingWarningOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }, [
    activeRunId,
    applyReasoningResult,
    buildRunRequest,
    canResubmitFramingAnswers,
    framingAnswers,
    linkedReviewId,
    openFramingQuestions,
    result?.runId,
    skippedFramingQuestionIds,
  ]);

  const requestFramingResubmit = useCallback(() => {
    if (!canResubmitFramingAnswers) {
      return;
    }

    if (hasSkippedFramingQuestions(skippedFramingQuestionIds)) {
      setSkippedFramingWarningOpen(true);

      return;
    }

    void resubmitFramingAnswers();
  }, [canResubmitFramingAnswers, resubmitFramingAnswers, skippedFramingQuestionIds]);

  return (
    <section
      className={cn(DESIGN_TOKENS.callout.neutral, "space-y-3 p-4")}
      data-testid="architecture-draft-ai-refine-panel"
      aria-labelledby="architecture-draft-ai-refine-heading"
    >
      <div className="space-y-1">
        <h2
          id="architecture-draft-ai-refine-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {ARCHITECTURE_DRAFT_AI_REFINE_HEADING}
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {canPublish
            ? "Closed-loop reasoning uses this draft’s overview and publishes gated findings into the linked review."
            : "Closed-loop reasoning uses this draft’s overview to surface findings before you start a review. Publishing into product findings requires a linked review."}
        </p>
      </div>

      {architectureDescription.trim().length === 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          Add a system name or architecture overview before refining with AI.
        </p>
      ) : (
        <>
          <ArchitectureIntelligenceAnalysisDepthSelect
            id="architecture-draft-ai-refine-depth"
            testId="architecture-draft-ai-refine-depth"
            value={reviewTier}
            disabled={busy || disabled || blocksLlmExecution}
            onValueChange={setReviewTier}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!canRefine}
              data-testid="architecture-draft-ai-refine-run"
              onClick={() => void refine()}
            >
              {busy
                ? canPublish
                  ? "Refining and publishing…"
                  : "Running architecture reasoning…"
                : canPublish
                  ? "Refine and publish to linked review"
                  : "Refine architecture with AI"}
            </Button>
            {canPublish && linkedReviewId !== null ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link
                  href={buildArchitectureIntelligenceRunHref({
                    runId: linkedReviewId,
                    from: "reviews",
                  })}
                  data-testid="architecture-draft-ai-refine-full-lab"
                >
                  Open full architecture intelligence
                </Link>
              </Button>
            ) : null}
          </div>

          <AiBudgetSpendNotice
            action="Architecture refine"
            testId="architecture-draft-ai-refine-budget"
          />
          <WhyDisabledCtaHint
            reason={blocksLlmExecution ? whyDisabledLlmBudgetExhausted() : null}
            testId="architecture-draft-ai-refine-disabled-hint"
          />
        </>
      )}

      {error !== null ? (
        <p
          role="alert"
          data-testid="architecture-draft-ai-refine-error"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {error}
        </p>
      ) : null}

      {result !== null ? (
        <>
          <ArchitectureIntelligenceRefineResultSummary
            result={result}
            testIdPrefix="architecture-draft-ai-refine"
            linkedReviewId={linkedReviewId}
            canPublish={canPublish}
          />
          {showFramingInterview ? (
            <ArchitectureIntelligenceFramingInterviewPanel
              questions={openFramingQuestions}
              answers={framingAnswers}
              skippedQuestionIds={skippedFramingQuestionIds}
              busy={busy}
              canResubmit={canResubmitFramingAnswers && !disabled && !blocksLlmExecution}
              overviewSourceText={architectureDescription}
              businessOutcome={fields.businessOutcome}
              structuredBrief={fields.structuredBrief}
              disabled={disabled}
              testIdPrefix="architecture-draft-ai-refine-framing"
              onAnswerChange={(questionId, value) => {
                setFramingAnswers((current) => ({
                  ...current,
                  [questionId]: value,
                }));
              }}
              onSkippedQuestionIdsChange={setSkippedFramingQuestionIds}
              onResubmit={requestFramingResubmit}
            />
          ) : null}
        </>
      ) : null}

      <ConfirmationDialog
        open={skippedFramingWarningOpen}
        onOpenChange={setSkippedFramingWarningOpen}
        title={ARCHITECTURE_FRAMING_SKIPPED_WARNING_TITLE}
        description={ARCHITECTURE_FRAMING_SKIPPED_WARNING_DESCRIPTION}
        confirmLabel={ARCHITECTURE_FRAMING_SKIPPED_WARNING_PROCEED_LABEL}
        cancelLabel={ARCHITECTURE_FRAMING_SKIPPED_WARNING_GO_BACK_LABEL}
        variant="default"
        busy={busy}
        onConfirm={() => {
          void resubmitFramingAnswers();
        }}
      />
    </section>
  );
}
