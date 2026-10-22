"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useRunExportHistoryQuery } from "@/hooks/use-run-export-history-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RunDetailExportHistoryCalloutProps = {
  readonly runId: string;
};

/** Wave-62 suggestion 729: fail-closed run export history blocked-reason on run detail exports. */
export function RunDetailExportHistoryCallout(props: RunDetailExportHistoryCalloutProps) {
  const { blockedReason, failure } = useRunExportHistoryQuery(props.runId, {
    enabled: props.runId.trim().length > 0,
  });

  if (blockedReason === null && failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="run-detail-export-history-blocked">
      {failure ? <OperatorApiProblem failure={failure} /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
