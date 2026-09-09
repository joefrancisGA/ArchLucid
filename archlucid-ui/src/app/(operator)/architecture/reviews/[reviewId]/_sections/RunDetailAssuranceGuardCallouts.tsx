"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useRunComparisonHistoryQuery } from "@/hooks/use-run-comparison-history-query";
import { useExportLineageVerifyQuery } from "@/hooks/use-export-lineage-verify-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RunDetailAssuranceGuardCalloutsProps = {
  readonly runId: string;
};

/** Wave-61 suggestion 728: fail-closed export lineage and comparison history blocked-reason on run detail. */
export function RunDetailAssuranceGuardCallouts(props: RunDetailAssuranceGuardCalloutsProps) {
  const runId = props.runId.trim();
  const lineageQuery = useExportLineageVerifyQuery({ runId, enabled: runId.length > 0 });
  const comparisonHistoryQuery = useRunComparisonHistoryQuery(runId, { enabled: runId.length > 0 });

  const blockedReason = lineageQuery.blockedReason ?? comparisonHistoryQuery.blockedReason;
  const failure = lineageQuery.failure ?? comparisonHistoryQuery.failure;

  if (blockedReason === null && failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="run-detail-assurance-guard-blocked">
      {failure ? <OperatorApiProblem failure={failure} /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
