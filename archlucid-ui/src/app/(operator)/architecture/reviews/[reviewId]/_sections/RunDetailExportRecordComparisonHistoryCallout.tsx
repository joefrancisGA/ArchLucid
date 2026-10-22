"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useExportRecordComparisonHistoryQuery } from "@/hooks/use-export-record-comparison-history-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RunDetailExportRecordComparisonHistoryCalloutProps = {
  readonly exportRecordId: string;
};

/** Wave-62 suggestion 730: fail-closed export-record comparison history blocked-reason on run detail exports. */
export function RunDetailExportRecordComparisonHistoryCallout(
  props: RunDetailExportRecordComparisonHistoryCalloutProps,
) {
  const { blockedReason, failure } = useExportRecordComparisonHistoryQuery(props.exportRecordId, {
    enabled: props.exportRecordId.trim().length > 0,
  });

  if (blockedReason === null && failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="run-detail-export-record-comparison-history-blocked">
      {failure ? <OperatorApiProblem failure={failure} /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
