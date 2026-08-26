"use client";

import { Button } from "@/components/ui/button";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { useRunDetailWorkspaceContextBundleQuery } from "@/hooks/use-run-detail-workspace-context-bundle-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CompareNaturalPairSuggestionProps = {
  readonly leftRunId: string;
  readonly rightRunId: string;
  readonly onApplyPair: (priorRunId: string, laterRunId: string) => void;
};

/** Suggests comparing the workspace active review against its prior finalized sibling. */
export function CompareNaturalPairSuggestion(props: CompareNaturalPairSuggestionProps): React.JSX.Element | null {
  const workspaceRun = useWorkspaceActiveRun();
  const laterRunId = workspaceRun?.activeRunId?.trim() ?? "";
  const contextQuery = useRunDetailWorkspaceContextBundleQuery(laterRunId, {
    enabled: laterRunId.length > 0,
  });
  const priorRunId = contextQuery.data?.priorCommittedRunId?.trim() ?? "";

  if (priorRunId.length === 0 || laterRunId.length === 0) {
    return null;
  }

  if (props.leftRunId.trim().length > 0 || props.rightRunId.trim().length > 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="compare-natural-pair-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="compare-natural-pair-suggestion"
    >
      <h2
        id="compare-natural-pair-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Suggested comparison pair
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Compare the prior finalized review against your workspace active review in one step.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        data-testid="compare-natural-pair-apply"
        onClick={() => {
          props.onApplyPair(priorRunId, laterRunId);
        }}
      >
        Use prior vs active review
      </Button>
    </section>
  );
}
