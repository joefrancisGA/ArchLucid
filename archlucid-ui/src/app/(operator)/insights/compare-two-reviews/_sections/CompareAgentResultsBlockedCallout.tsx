"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useCompareAgentResultsQuery } from "@/hooks/use-compare-agent-results-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CompareAgentResultsBlockedCalloutProps = {
  readonly leftRunId: string;
  readonly rightRunId: string;
};

/** Wave-61 suggestion 727: fail-closed compare-agent-results blocked-reason on compare panel. */
export function CompareAgentResultsBlockedCallout(props: CompareAgentResultsBlockedCalloutProps) {
  const leftRunId = props.leftRunId.trim();
  const rightRunId = props.rightRunId.trim();
  const { blockedReason, failure } = useCompareAgentResultsQuery({
    leftRunId,
    rightRunId,
    enabled: leftRunId.length > 0 && rightRunId.length > 0,
  });

  if (blockedReason === null && failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="compare-agent-results-blocked">
      {failure ? <OperatorApiProblem failure={failure} /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
