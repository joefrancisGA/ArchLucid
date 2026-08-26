"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { ArchitectureIntelligenceAnalysisDepthSelect } from "@/components/architecture-intelligence/ArchitectureIntelligenceAnalysisDepthSelect";
import { ArchitectureIntelligenceRefineResultSummary } from "@/components/architecture-intelligence/ArchitectureIntelligenceRefineResultSummary";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { useArchitectureIntelligenceSourceContextQuery } from "@/hooks/use-architecture-intelligence-source-context-query";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  buildArchitectureIntelligenceRunRequest,
  primaryDescriptionFromSources,
  runArchitectureIntelligenceReasoning,
  type ClosedLoopReasoningResult,
  type ClosedLoopReasoningSourceText,
} from "@/lib/architecture/architecture-intelligence-api";
import type { ArchitectureIntelligenceReviewTier } from "@/lib/architecture/architecture-intelligence-review-tier";
import { buildArchitectureIntelligenceRunHref } from "@/lib/architecture/architecture-intelligence-run-href";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { whyDisabledLlmBudgetExhausted } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";

export type RunDetailAiRefinePanelProps = {
  readonly runId: string;
};

type SourceContextStatus = "loading" | "ready" | "empty" | "error";

/**
 * Operator-initiated closed-loop refinement for the open review.
 * Loads product intake for the run, spends metered AI budget on demand, and publishes gated output.
 */
export function RunDetailAiRefinePanel(props: RunDetailAiRefinePanelProps) {
  const { runId } = props;
  const { blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const sourceContextQuery = useArchitectureIntelligenceSourceContextQuery(runId);

  const [reviewTier, setReviewTier] = useState<ArchitectureIntelligenceReviewTier>("Standard");
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState<ApiLoadFailureState | null>(null);
  const [result, setResult] = useState<ClosedLoopReasoningResult | null>(null);

  const hydratedSources = useMemo(
    () => [...(sourceContextQuery.data?.sourceTexts ?? [])],
    [sourceContextQuery.data?.sourceTexts],
  );
  const architectureDescription = useMemo(
    () => primaryDescriptionFromSources([...(sourceContextQuery.data?.sourceTexts ?? [])]),
    [sourceContextQuery.data?.sourceTexts],
  );
  const priorities = useMemo(
    () => [...(sourceContextQuery.data?.declaredPriorities ?? [])],
    [sourceContextQuery.data?.declaredPriorities],
  );

  const contextStatus: SourceContextStatus = sourceContextQuery.isPending
    ? "loading"
    : sourceContextQuery.isError
      ? "error"
      : (sourceContextQuery.data?.sourceTexts.length ?? 0) > 0
        ? "ready"
        : "empty";
  const error =
    mutationError ??
    (sourceContextQuery.isError ? toApiLoadFailure(sourceContextQuery.error) : null);

  const reloadSourceContext = useCallback(() => {
    setResult(null);
    setMutationError(null);
    void sourceContextQuery.refetch();
  }, [sourceContextQuery]);

  const canRefine =
    contextStatus === "ready" &&
    architectureDescription.trim().length > 0 &&
    !busy &&
    !blocksLlmExecution;

  const refineAndPublish = useCallback(async () => {
    if (!canRefine) {
      return;
    }

    setBusy(true);
    setMutationError(null);

    try {
      const next = await runArchitectureIntelligenceReasoning(
        buildArchitectureIntelligenceRunRequest({
          architectureDescription,
          priorities,
          runId,
          hydratedSourceTexts: hydratedSources,
          publishToProduct: true,
          reviewTier,
        }),
      );

      setResult(next);
    } catch (cause) {
      setMutationError(toApiLoadFailure(cause));
    } finally {
      setBusy(false);
    }
  }, [
    architectureDescription,
    canRefine,
    hydratedSources,
    priorities,
    reviewTier,
    runId,
  ]);

  return (
    <div className="space-y-3" data-testid="run-detail-ai-refine-panel">
      {contextStatus === "loading" ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Loading architecture intake for this review…
        </p>
      ) : null}

      {contextStatus === "empty" ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          No architecture intake is attached to this review yet.{" "}
          <Link
            href={buildArchitectureIntelligenceRunHref({ runId, from: "reviews" })}
            className={OPERATOR_LINK.inline}
          >
            Open architecture intelligence
          </Link>{" "}
          to paste a description.
        </p>
      ) : null}

      {contextStatus === "ready" ? (
        <>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Intake loaded
            {hydratedSources.length > 1
              ? ` (${hydratedSources.length} sources)`
              : ""}
            . Refining publishes gated findings and recommendations back into this review.
          </p>

          <ArchitectureIntelligenceAnalysisDepthSelect
            id="run-detail-ai-refine-depth"
            testId="run-detail-ai-refine-depth"
            value={reviewTier}
            disabled={busy || blocksLlmExecution}
            onValueChange={setReviewTier}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!canRefine}
              data-testid="run-detail-ai-refine-run"
              onClick={() => void refineAndPublish()}
            >
              {busy ? "Refining and publishing…" : "Refine and publish findings"}
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link
                href={buildArchitectureIntelligenceRunHref({ runId, from: "reviews" })}
                data-testid="run-detail-architecture-intelligence-link"
              >
                Open full architecture intelligence
              </Link>
            </Button>
          </div>

          <AiBudgetSpendNotice
            action="Refine and publish"
            testId="run-detail-ai-refine-budget"
          />
          <WhyDisabledCtaHint
            reason={blocksLlmExecution ? whyDisabledLlmBudgetExhausted() : null}
            testId="run-detail-ai-refine-disabled-hint"
          />
        </>
      ) : null}

      {error !== null ? (
        <div className="space-y-2" data-testid="run-detail-ai-refine-error">
          <OperatorApiProblem failure={error} />
          <Button type="button" variant="outline" size="sm" onClick={() => void reloadSourceContext()}>
            Try again
          </Button>
        </div>
      ) : null}

      {result !== null ? (
        <ArchitectureIntelligenceRefineResultSummary
          result={result}
          testIdPrefix="run-detail-ai-refine"
        />
      ) : null}
    </div>
  );
}
