"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { authoritativeAgentEvaluationPerspective } from "@/lib/agent-evaluation-perspective";
import { getRunAgentEvaluation } from "@/lib/api";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatQualityGateModeStampLabel,
  QUALITY_GATE_WARN_ONLY_WORKING_COPY,
  shouldBlockWorkingCareerExportForQualityGate,
} from "@/lib/governance/agent-output-quality-gate-career-honesty";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { StructuralExecutionModeWire, type StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import { cn } from "@/lib/utils";

export type RunDetailQualityGateModeStripProps = {
  readonly runId: string;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly isSample?: boolean | null;
  readonly className?: string;
};

/** DR-05: persistent Working banner showing recorded quality-gate mode on the stamp band. */
export function RunDetailQualityGateModeStrip(
  props: RunDetailQualityGateModeStripProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const healthQuery = useHealthReadySummaryQuery({ enabled: isWorkingMode });
  const evaluationQuery = useQuery({
    queryKey: operatorQueryKeys.runAgentEvaluation(props.runId),
    queryFn: async () => (await getRunAgentEvaluation(props.runId)).data,
    enabled: isWorkingMode,
    retry: false,
  });

  if (!isWorkingMode) {
    return null;
  }

  const hostQualityGateMode = healthQuery.data?.agentOutputQualityGateMode ?? "WarnOnly";
  const hostAgentExecutionMode = healthQuery.data?.agentExecutionMode ?? null;
  const recordedPerspective = authoritativeAgentEvaluationPerspective(evaluationQuery.data ?? null);
  const recordedMode = recordedPerspective?.gateDefinition?.mode ?? null;
  const aggregateOutcome = recordedPerspective?.aggregateQualityGateOutcome ?? null;
  const modeLabel = formatQualityGateModeStampLabel(recordedMode, hostQualityGateMode);
  const showWarnOnlyHonesty =
    props.structuralExecutionMode === StructuralExecutionModeWire.Real
    && shouldBlockWorkingCareerExportForQualityGate({
      workingDesk: true,
      structuralExecutionMode: props.structuralExecutionMode,
      isSample: props.isSample,
      hostAgentExecutionMode,
      hostQualityGateMode,
      aggregateQualityGateOutcome: aggregateOutcome,
    });

  return (
    <div
      className={cn(
        showWarnOnlyHonesty ? DESIGN_TOKENS.callout.warnShell : DESIGN_TOKENS.callout.info,
        "p-4",
        props.className,
      )}
      data-testid="run-detail-quality-gate-mode-strip"
      role="status"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {modeLabel}
      </p>
      {showWarnOnlyHonesty ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {QUALITY_GATE_WARN_ONLY_WORKING_COPY}
        </p>
      ) : null}
    </div>
  );
}
