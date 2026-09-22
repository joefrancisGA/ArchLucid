"use client";

import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { resolveUnsupportedSemanticSupportFinalizeBlockedReason } from "@/lib/findings/semantic-support-band-finalize-honesty";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

export function useUnsupportedSemanticSupportFinalizeBlockedReason(input: {
  readonly findings: readonly QuickDecisionFinding[];
  readonly manifestFinalized: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
}): string | null {
  const { isWorkingMode } = useWorkspaceMode();
  const healthQuery = useHealthReadySummaryQuery({ enabled: isWorkingMode });

  return resolveUnsupportedSemanticSupportFinalizeBlockedReason({
    workingDesk: isWorkingMode,
    manifestFinalized: input.manifestFinalized,
    findings: input.findings,
    structuralExecutionMode: input.structuralExecutionMode,
    hostQualityGateMode: healthQuery.data?.agentOutputQualityGateMode ?? null,
    pilotStrictHoldOnUnsupportedSemanticSupport:
      healthQuery.data?.pilotStrictHoldOnUnsupportedSemanticSupport ?? null,
  });
}
