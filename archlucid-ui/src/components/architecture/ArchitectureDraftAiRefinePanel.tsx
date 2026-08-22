"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { ArchitectureIntelligenceAnalysisDepthSelect } from "@/components/architecture-intelligence/ArchitectureIntelligenceAnalysisDepthSelect";
import { ArchitectureIntelligenceRefineResultSummary } from "@/components/architecture-intelligence/ArchitectureIntelligenceRefineResultSummary";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { ARCHITECTURE_DRAFT_AI_REFINE_HEADING } from "@/lib/architecture/architecture-draft-ai-refine-copy";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import {
  buildArchitectureIntelligenceRunRequest,
  buildArchitectureIntelligenceSourcesFromDraftFields,
  primaryDescriptionFromSources,
  runArchitectureIntelligenceReasoning,
  type ClosedLoopReasoningResult,
} from "@/lib/architecture/architecture-intelligence-api";
import type { ArchitectureIntelligenceReviewTier } from "@/lib/architecture/architecture-intelligence-review-tier";
import { buildArchitectureIntelligenceRunHref } from "@/lib/architecture/architecture-intelligence-run-href";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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

  const refine = useCallback(async () => {
    if (!canRefine) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const next = await runArchitectureIntelligenceReasoning(
        buildArchitectureIntelligenceRunRequest({
          architectureDescription,
          runId: canPublish ? linkedReviewId : null,
          hydratedSourceTexts: hydratedSources,
          publishToProduct: canPublish,
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
    canPublish,
    canRefine,
    hydratedSources,
    linkedReviewId,
    reviewTier,
  ]);

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
          />
          {!canPublish && !result.budgetRejected ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Start a review when you are ready to capture these findings on a product run.
            </p>
          ) : null}
          {canPublish && linkedReviewId !== null && result.publishedToProduct === true ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              <Link href={reviewDetailPath(linkedReviewId)} className={OPERATOR_LINK.inline}>
                Open linked review
              </Link>{" "}
              to continue from the published findings.
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
