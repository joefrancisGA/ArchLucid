"use client";

import type { ReactElement } from "react";

import { RunDetailOperatorTechnicalDisclosure } from "@/app/(operator)/reviews/[runId]/_sections/RunDetailOperatorTechnicalDisclosure";
import {
  RunDetailAgentResultsSummaryCardDeferred,
  RunDetailEstimatedLlmCostCardDeferred,
  RunDetailRetrievalGroundingSummaryCardDeferred,
  RunDetailReviewAgentExecutionLogSectionDeferred,
  RunDetailRunMetadataSectionDeferred,
} from "@/app/(operator)/reviews/[runId]/_sections/run-detail-page-view-deferred-chunks";
import type {
  RunDetailAgentResult,
  RunRetrievalGroundingSummary,
  RunAgentExecutionLlmCostEstimate,
  RunSummary,
} from "@/types/authority";

type RunDetailOperatorTechnicalForensicsPanelProps = {
  readonly agentExecutionLlmCostEstimate: RunAgentExecutionLlmCostEstimate | null | undefined;
  readonly results: readonly RunDetailAgentResult[] | null | undefined;
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
        retrievalGroundingSummary={props.retrievalGroundingSummary}
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
