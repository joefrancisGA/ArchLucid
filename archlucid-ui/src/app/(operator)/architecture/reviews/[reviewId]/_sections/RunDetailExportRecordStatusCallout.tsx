"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useExportRecordQuery } from "@/hooks/use-export-record-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RunDetailExportRecordStatusCalloutProps = {
  readonly exportRecordId: string;
};

/** Wave-61 suggestion 725: fail-closed export-record read blocked-reason on run detail exports. */
export function RunDetailExportRecordStatusCallout(props: RunDetailExportRecordStatusCalloutProps) {
  const { blockedReason, failure } = useExportRecordQuery(props.exportRecordId, {
    enabled: props.exportRecordId.trim().length > 0,
  });

  if (blockedReason === null && failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="run-detail-export-record-blocked">
      {failure ? <OperatorApiProblem failure={failure} /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
