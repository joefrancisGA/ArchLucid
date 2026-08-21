"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { ArchitectureIntelligenceAnalysisDepthSelect } from "@/components/architecture-intelligence/ArchitectureIntelligenceAnalysisDepthSelect";
import { ArchitectureIntelligenceRefineResultSummary } from "@/components/architecture-intelligence/ArchitectureIntelligenceRefineResultSummary";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import {
  buildArchitectureIntelligenceRunRequest,
  fetchArchitectureIntelligenceProductSourceContext,
  primaryDescriptionFromSources,
  runArchitectureIntelligenceReasoning,
  type ClosedLoopReasoningResult,
  type ClosedLoopReasoningSourceText,
} from "@/lib/architecture/architecture-intelligence-api";
import type { ArchitectureIntelligenceReviewTier } from "@/lib/architecture/architecture-intelligence-review-tier";
import { buildArchitectureIntelligenceRunHref } from "@/lib/architecture/architecture-intelligence-run-href";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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

  const [contextStatus, setContextStatus] = useState<SourceContextStatus>("loading");
  const [hydratedSources, setHydratedSources] = useState<ClosedLoopReasoningSourceText[]>([]);
  const [architectureDescription, setArchitectureDescription] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [reviewTier, setReviewTier] = useState<ArchitectureIntelligenceReviewTier>("Standard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClosedLoopReasoningResult | null>(null);

  useEffect(() => {
    let canceled = false;

    setContextStatus("loading");
    setError(null);
    setResult(null);

    void (async () => {
      try {
        const context = await fetchArchitectureIntelligenceProductSourceContext(runId);

        if (canceled) {
          return;
        }

        const sources = context.sourceTexts ?? [];
        setHydratedSources(sources);
        setArchitectureDescription(primaryDescriptionFromSources(sources));
        setPriorities(context.declaredPriorities ?? []);
        setContextStatus(sources.length > 0 ? "ready" : "empty");
      } catch (cause) {
        if (canceled) {
          return;
        }

        setContextStatus("error");
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load architecture intake for this review.",
        );
      }
    })();

    return () => {
      canceled = true;
    };
  }, [runId]);

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
    setError(null);

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
      setError(cause instanceof Error ? cause.message : String(cause));
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
        <p
          role="alert"
          data-testid="run-detail-ai-refine-error"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {error}
        </p>
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
