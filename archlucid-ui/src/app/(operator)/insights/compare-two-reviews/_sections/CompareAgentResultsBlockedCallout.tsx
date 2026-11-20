"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { COMPARE_AGENT_RESULTS_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-agent-results-empty-not-load-failure-copy";
import { COMPARE_AGENT_RESULTS_BLOCKED_NOT_EMPTY_DELTA_LINE } from "@/lib/architecture/compare-agent-results-blocked-not-empty-delta-copy";
import { compareAgentResultsResponseIsEmpty } from "@/lib/compare/compare-agent-results-empty";
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
  const query = useCompareAgentResultsQuery({
    leftRunId,
    rightRunId,
    enabled: leftRunId.length > 0 && rightRunId.length > 0,
  });

  const { blockedReason, failure } = query;
  const agentResultsEmpty =
            query.isSuccess && compareAgentResultsResponseIsEmpty(query.data);

  if (blockedReason === null && failure === null && !agentResultsEmpty) {
    return null;
  }

  return (
    <div
      className="space-y-2"
      data-testid={agentResultsEmpty ? "compare-agent-results-empty-not-load-failure" : "compare-agent-results-blocked"}
    >
      {failure ? <OperatorApiProblem failure={failure} /> : null}
      {agentResultsEmpty ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {COMPARE_AGENT_RESULTS_EMPTY_NOT_LOAD_FAILURE_LINE}
        </p>
      ) : null}
      {blockedReason ? (
        <>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="compare-agent-results-blocked-not-empty-delta"
          >
            {COMPARE_AGENT_RESULTS_BLOCKED_NOT_EMPTY_DELTA_LINE}
          </p>
        </>
      ) : null}
    </div>
  );
}
