"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ArchitectureIntelligenceProductRoundTrip } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceProductRoundTrip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import {
  buildArchitectureIntelligenceRunRequest,
  fetchArchitectureIntelligenceProductSourceContext,
  formatArchitectureIntelligenceSpendSummary,
  primaryDescriptionFromSources,
  runArchitectureIntelligenceReasoning,
  type ClosedLoopReasoningResult,
  type ClosedLoopReasoningSourceText,
} from "@/lib/architecture-intelligence-api";
import {
  ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS,
  architectureIntelligenceReviewTierLabel,
  isArchitectureIntelligenceReviewTier,
  type ArchitectureIntelligenceReviewTier,
} from "@/lib/architecture-intelligence-review-tier";
import { buildArchitectureIntelligenceRunHref } from "@/lib/architecture-intelligence-run-href";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
    let cancelled = false;

    setContextStatus("loading");
    setError(null);
    setResult(null);

    void (async () => {
      try {
        const context = await fetchArchitectureIntelligenceProductSourceContext(runId);

        if (cancelled) {
          return;
        }

        const sources = context.sourceTexts ?? [];
        setHydratedSources(sources);
        setArchitectureDescription(primaryDescriptionFromSources(sources));
        setPriorities(context.declaredPriorities ?? []);
        setContextStatus(sources.length > 0 ? "ready" : "empty");
      } catch (cause) {
        if (cancelled) {
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
      cancelled = true;
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

          <div className="space-y-2">
            <Label htmlFor="run-detail-ai-refine-depth">Analysis depth</Label>
            <select
              id="run-detail-ai-refine-depth"
              data-testid="run-detail-ai-refine-depth"
              className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={reviewTier}
              disabled={busy || blocksLlmExecution}
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
          </div>

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

      {result !== null ? <RunDetailAiRefineResultSummary result={result} /> : null}
    </div>
  );
}

function RunDetailAiRefineResultSummary(props: { readonly result: ClosedLoopReasoningResult }) {
  const { result } = props;

  return (
    <div className="space-y-2" data-testid="run-detail-ai-refine-results">
      {result.budgetRejected ? (
        <p
          role="alert"
          data-testid="run-detail-ai-refine-budget-rejected"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          Analysis not started:{" "}
          {result.budgetRejectReason ?? "Pre-flight AI budget admission rejected this analysis."}
        </p>
      ) : null}

      {result.publishBlocked ? (
        <p
          role="alert"
          data-testid="run-detail-ai-refine-publish-blocked"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          Publish blocked:{" "}
          {(result.publishBlockReasons ?? []).join(" · ") || "trust gate rejected publishable output."}
        </p>
      ) : null}

      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Model elements: {result.model?.elements?.length ?? 0} · Integrity-passed findings:{" "}
        {result.integrityPassedFindingIds?.length ?? 0}
        {result.cacheHit
          ? ` · Cache hit${result.cacheReuseReason ? ` (${result.cacheReuseReason})` : ""}`
          : " · Cache miss"}
        {formatArchitectureIntelligenceSpendSummary(result)}
      </p>

      <ArchitectureIntelligenceProductRoundTrip
        runId={result.runId ?? undefined}
        publishedToProduct={result.publishedToProduct === true}
        publishedRecommendationCount={result.publishedRecommendationCount}
        publishSkipReason={result.publishSkipReason}
      />
    </div>
  );
}
