"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useArchitectureIntelligenceRunModelQuery } from "@/hooks/use-architecture-intelligence-run-model-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ArchitectureIntelligenceRunModelGuardCalloutProps = {
  readonly runId: string;
};

/** Wave-62 suggestion 731: fail-closed closed-loop run model blocked-reason on architecture intelligence. */
export function ArchitectureIntelligenceRunModelGuardCallout(props: ArchitectureIntelligenceRunModelGuardCalloutProps) {
  const trimmed = props.runId.trim();
  const { blockedReason, failure } = useArchitectureIntelligenceRunModelQuery(trimmed, {
    enabled: trimmed.length > 0,
  });

  if (blockedReason === null && failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="architecture-intelligence-run-model-blocked">
      {failure ? <OperatorApiProblem failure={failure} /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
