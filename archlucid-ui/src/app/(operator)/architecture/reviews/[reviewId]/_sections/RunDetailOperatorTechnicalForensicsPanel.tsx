"use client";

import type { ReactElement } from "react";

import { RunDetailOperatorTechnicalDisclosure } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailOperatorTechnicalDisclosure";
import {
  RunDetailAgentResultsSummaryCardDeferred,
  RunDetailEstimatedLlmCostCardDeferred,
  RunDetailRetrievalGroundingSummaryCardDeferred,
  RunDetailReviewAgentExecutionLogSectionDeferred,
  RunDetailRunMetadataSectionDeferred,
} from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-page-view-deferred-chunks";
import type {
  RunDetailAgentResult,
  RunRetrievalGroundingSummary,
  RunAgentExecutionLlmCostEstimate,
  RunSummary,
} from "@/types/authority";

type AgentExecutionOutcomeWire = {
  readonly agentType?: string | null;
  readonly outcome?: string | null;
  readonly taskId?: string | null;
  readonly degradationReasonCode?: string | null;
};

type RunDetailOperatorTechnicalForensicsPanelProps = {
  readonly agentExecutionLlmCostEstimate: RunAgentExecutionLlmCostEstimate | null | undefined;
  readonly results: readonly RunDetailAgentResult[] | null | undefined;
  readonly agentExecutionOutcomes?: readonly AgentExecutionOutcomeWire[] | null;
  readonly retrievalGroundingSummary: RunRetrievalGroundingSummary | null | undefined;
  readonly run: RunSummary;
  readonly runDetailTraceId: string | null;
};

/** Operator forensics cards behind default-closed disclosure; chunks load via dynamic import (TB-697). */
export function RunDetailOperatorTechnicalForensicsPanel(
  props: RunDetailOperatorTechnicalForensicsPanelProps,
): ReactElement {
  return (
    <RunDetailOperatorTechnicalDisclosure>
      <RunDetailEstimatedLlmCostCardDeferred estimate={props.agentExecutionLlmCostEstimate} />
      <RunDetailAgentResultsSummaryCardDeferred
        results={props.results}
        agentExecutionOutcomes={props.agentExecutionOutcomes}
        retrievalGroundingSummary={props.retrievalGroundingSummary}
        runId={props.run.runId}
      />
      <RunDetailReviewAgentExecutionLogSectionDeferred results={props.results} />
      <RunDetailRetrievalGroundingSummaryCardDeferred
        summary={props.retrievalGroundingSummary}
        runId={props.run.runId}
      />
      <RunDetailRunMetadataSectionDeferred run={props.run} runDetailTraceId={props.runDetailTraceId} />
    </RunDetailOperatorTechnicalDisclosure>
  );
}
