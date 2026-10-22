"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useExportRecordCompareQuery } from "@/hooks/use-export-record-compare-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RunDetailExportRecordCompareCalloutProps = {
  readonly leftExportRecordId: string;
  readonly rightExportRecordId: string;
};

/** Wave-60 suggestion 713: fail-closed export-record compare blocked-reason on run detail exports. */
export function RunDetailExportRecordCompareCallout(props: RunDetailExportRecordCompareCalloutProps) {
  const { blockedReason, failure } = useExportRecordCompareQuery({
    leftExportRecordId: props.leftExportRecordId,
    rightExportRecordId: props.rightExportRecordId,
    enabled:
      props.leftExportRecordId.trim().length > 0 && props.rightExportRecordId.trim().length > 0,
  });

  if (blockedReason === null && failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="run-detail-export-record-compare-blocked">
      {failure ? <OperatorApiProblem failure={failure} /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
