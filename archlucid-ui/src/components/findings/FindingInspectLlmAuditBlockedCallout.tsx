"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { findingLlmAuditBlockedReason } from "@/lib/findings/finding-llm-audit-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type FindingInspectLlmAuditBlockedCalloutProps = {
  readonly failure: ApiLoadFailureState | null;
};

/** Wave-63 suggestion 745: fail-closed finding LLM audit blocked-reason in inspect debug panel. */
export function FindingInspectLlmAuditBlockedCallout(props: FindingInspectLlmAuditBlockedCalloutProps) {
  const blockedReason = findingLlmAuditBlockedReason(props.failure);

  if (blockedReason === null && props.failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="finding-inspect-llm-audit-blocked">
      {props.failure ? <OperatorApiProblem failure={props.failure} variant="warning" /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
