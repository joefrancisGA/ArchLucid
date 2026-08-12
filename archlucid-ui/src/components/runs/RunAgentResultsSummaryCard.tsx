"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import { executeArchitectureRunSelective } from "@/lib/api/architecture-runs";
import { resolveFailedAgentTypesForSelectiveRetry } from "@/lib/runs/run-detail-selective-agent-retry";
import type { RunDetailAgentResult, RunRetrievalGroundingSummary } from "@/types/authority";

export type AgentExecutionOutcomeRow = {
  readonly agentType?: string | null;
  readonly outcome?: string | null;
  readonly taskId?: string | null;
  readonly degradationReasonCode?: string | null;
};

function countArray(value: readonly unknown[] | null | undefined): number {
  return Array.isArray(value) ? value.length : 0;
}

function topologyExemplarLink(summary: RunRetrievalGroundingSummary | null | undefined): ReactElement | null {
  if (summary === null || summary === undefined)
    return null;

  const missing = summary.topologyReferenceArchitectureExemplarMissing === true;
  const count = summary.topologyReferenceArchitectureExemplarCount ?? 0;

  if (!missing && count === 0)
    return null;

  return (
    <p className="m-0 mt-1">
      <a className="font-medium underline underline-offset-2" href="#run-retrieval-exemplar-style-prior">
        {missing
          ? "No reference architecture exemplar matched — open retrieval grounding"
          : `${count} reference architecture exemplar chunk${count === 1 ? "" : "s"} used as style prior`}
      </a>
    </p>
  );
}

/** Summarizes architecture pipeline agent results on the operator run detail page (TB-106 / TB-937 / TB-938). */
export function RunAgentResultsSummaryCard(props: {
  readonly results: readonly RunDetailAgentResult[] | null | undefined;
  readonly agentExecutionOutcomes?: readonly AgentExecutionOutcomeRow[] | null;
  readonly retrievalGroundingSummary?: RunRetrievalGroundingSummary | null;
  readonly runId?: string | null;
}): ReactElement | null {
  const router = useRouter();
  const [retryBusy, setRetryBusy] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const outcomes = props.agentExecutionOutcomes?.filter((row) => row !== null && row !== undefined) ?? [];
  const rows = props.results?.filter((row) => row !== null && row !== undefined) ?? [];
  const failedAgentTypes = resolveFailedAgentTypesForSelectiveRetry(outcomes);
  const runId = (props.runId ?? "").trim();
  const canRetryFailed = runId.length > 0 && failedAgentTypes.length > 0;

  if (outcomes.length === 0 && rows.length === 0) {
    return null;
  }

  async function onRetryFailedAgents(): Promise<void> {
    if (!canRetryFailed || retryBusy) {
      return;
    }

    setRetryBusy(true);
    setRetryError(null);

    try {
      await executeArchitectureRunSelective(runId, {
        agentTypes: failedAgentTypes,
        includeDependents: true,
      });
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Selective retry failed.";
      setRetryError(message);
    } finally {
      setRetryBusy(false);
    }
  }

  return (
    <Card
      className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30"
      data-testid="run-agent-results-summary-card"
    >
      <CardHeader className="pb-2">
        <CardTitle className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Agent results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {outcomes.length > 0 ? (
          <ul className="m-0 list-none space-y-2 p-0" data-testid="run-agent-execution-outcomes">
            {outcomes.map((outcome) => {
              const agentKey = (outcome.agentType ?? "unknown").trim() || "unknown";
              const outcomeLabel = (outcome.outcome ?? "Missing").trim() || "Missing";

              return (
                <li
                  key={`${agentKey}-${outcome.taskId ?? "none"}`}
                  className={cn(
                    "rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  data-testid={`run-agent-outcome-row-${agentKey}`}
                >
                  <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                    {buyerLabelForAgentType(outcome.agentType)}
                  </p>
                  <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">
                    Outcome: {outcomeLabel}
                    {outcome.degradationReasonCode
                      ? ` · degradation ${outcome.degradationReasonCode}`
                      : null}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {rows.map((result) => {
              const claims = countArray(result.claims);
              const findings = countArray(result.findings);
              const evidenceRefs = countArray(result.evidenceRefs);
              const confidence =
                typeof result.confidence === "number" && Number.isFinite(result.confidence)
                  ? result.confidence.toFixed(2)
                  : null;

              return (
                <li
                  key={result.resultId}
                  className={cn(
                    "rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  data-testid={`run-agent-result-row-${result.resultId}`}
                >
                  <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                    {buyerLabelForAgentType(result.agentType)}
                  </p>
                  <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">
                    {claims} claim{claims === 1 ? "" : "s"}
                    {" · "}
                    {findings} finding{findings === 1 ? "" : "s"}
                    {" · "}
                    {evidenceRefs} evidence ref{evidenceRefs === 1 ? "" : "s"}
                    {confidence !== null ? ` · confidence ${confidence}` : null}
                  </p>
                  {result.agentType === "Topology"
                    ? topologyExemplarLink(props.retrievalGroundingSummary)
                    : null}
                </li>
              );
            })}
          </ul>
        )}
        {canRetryFailed ? (
          <div className="space-y-2" data-testid="run-agent-selective-retry">
            <button
              type="button"
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              data-testid="run-agent-retry-failed-button"
              disabled={retryBusy}
              onClick={() => {
                void onRetryFailedAgents();
              }}
            >
              {retryBusy ? "Retrying failed agents…" : "Retry failed agents"}
            </button>
            {retryError ? (
              <p className="m-0 text-sm text-red-700 dark:text-red-400" data-testid="run-agent-selective-retry-error">
                {retryError}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
