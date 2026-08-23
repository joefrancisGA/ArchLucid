"use client";

import { ArchitectureIntelligenceProductRoundTrip } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceProductRoundTrip";
import {
  formatArchitectureIntelligenceSpendSummary,
  type ClosedLoopReasoningResult,
} from "@/lib/architecture/architecture-intelligence-api";
import { resolvePublishBlockedAlertMessage } from "@/lib/architecture/architecture-intelligence-framing-interview";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureIntelligenceRefineResultSummaryProps = {
  readonly result: ClosedLoopReasoningResult;
  readonly testIdPrefix?: string;
};

/** Compact post-run economics, trust-gate, and product round-trip for in-place refine panels. */
export function ArchitectureIntelligenceRefineResultSummary(
  props: ArchitectureIntelligenceRefineResultSummaryProps,
) {
  const { result } = props;
  const prefix = props.testIdPrefix ?? "architecture-intelligence-refine";

  return (
    <div className="space-y-2" data-testid={`${prefix}-results`}>
      {result.budgetRejected ? (
        <p
          role="alert"
          data-testid={`${prefix}-budget-rejected`}
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
          data-testid={`${prefix}-publish-blocked`}
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {resolvePublishBlockedAlertMessage(result)}
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
