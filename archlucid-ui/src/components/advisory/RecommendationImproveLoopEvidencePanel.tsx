"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { RecommendationImproveLoopEvidence } from "@/types/advisory";

export type RecommendationImproveLoopEvidencePanelProps = {
  readonly evidence: RecommendationImproveLoopEvidence;
};

export function RecommendationImproveLoopEvidencePanel(
  props: RecommendationImproveLoopEvidencePanelProps,
): React.JSX.Element {
  const diffCount = props.evidence.diffEntries?.length ?? 0;
  const mergedCount = props.evidence.mergedFindingIds?.length ?? 0;

  return (
    <section
      className="space-y-2 rounded-lg border border-sky-200 bg-sky-50/80 p-4 dark:border-sky-900 dark:bg-sky-950/30"
      data-testid="recommendation-improve-loop-evidence-panel"
    >
      <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Improve-loop evidence
      </h3>
      <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
        {props.evidence.fullReReviewTriggered ? (
          <li>Full architecture re-review was triggered for this recommendation apply.</li>
        ) : (
          <li>Scoped incremental re-review ran for impacted model elements.</li>
        )}
        {diffCount > 0 ? <li>{diffCount} knowledge-model diff entr{diffCount === 1 ? "y" : "ies"} recorded.</li> : null}
        {mergedCount > 0 ? (
          <li>{mergedCount} finding(s) merged into the review snapshot.</li>
        ) : null}
      </ul>
      {props.evidence.partialScopeDisclaimer ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {props.evidence.partialScopeDisclaimer}
        </p>
      ) : null}
    </section>
  );
}
