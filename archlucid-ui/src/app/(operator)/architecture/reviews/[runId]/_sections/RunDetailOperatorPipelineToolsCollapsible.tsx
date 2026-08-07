"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { buildArchitectureIntelligenceRunHref } from "@/lib/architecture-intelligence-run-href";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RunDetailOperatorPipelineToolsCollapsibleProps = {
  readonly runId: string;
};

/**
 * Operator-initiated AI refinement for this review — spends metered AI budget on demand.
 * Closed-loop architecture intelligence is the primary action; replay validation stays nearby.
 */
export function RunDetailOperatorPipelineToolsCollapsible(
  props: RunDetailOperatorPipelineToolsCollapsibleProps,
): ReactElement {
  const { runId } = props;
  const { blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();

  return (
    <CollapsibleSection title="Refine with AI" defaultOpen={false} sectionTestId="run-detail-refine-with-ai">
      <div className="space-y-3">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Spend AI budget on this review to deepen findings, challenge assumptions, and publish gated
          recommendations back into the product.
        </p>

        <AiBudgetSpendNotice
          action="Architecture reasoning"
          testId="run-detail-refine-ai-budget-notice"
        />

        <div className="flex flex-wrap gap-3">
          {blocksLlmExecution ? (
            <Button variant="primary" size="sm" disabled data-testid="run-detail-architecture-intelligence-link">
              Refine this review with AI
            </Button>
          ) : (
            <Button variant="primary" size="sm" asChild>
              <Link
                href={buildArchitectureIntelligenceRunHref({ runId, from: "reviews" })}
                data-testid="run-detail-architecture-intelligence-link"
              >
                Refine this review with AI
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/replay?runId=${encodeURIComponent(runId)}`}>Validate review</Link>
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
