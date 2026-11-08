"use client";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import { formatAgentExecutionLimitationSuffix } from "@/lib/reviews/agent-execution-degradation-display";
import { executeArchitectureRunSelectiveInFlight } from "@/lib/api/architecture-runs";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { reviewSelectiveExecuteMutationBlockedReason } from "@/lib/runs/review-selective-execute-mutation-blocked-reason";
import { awaitMinimumVisibleDuration } from "@/lib/await-minimum-visible-duration";
import { resolveFailedAgentTypesForSelectiveRetry } from "@/lib/runs/run-detail-selective-agent-retry";
import type { RunDetailAgentResult, RunRetrievalGroundingSummary } from "@/types/authority";

export type AgentExecutionOutcomeRow = {
  readonly agentType?: string | null;
  readonly outcome?: string | null;
  readonly taskId?: string | null;
  readonly degradationReasonCode?: string | null;
};

export const AGENT_EXECUTION_OUTCOME_NOT_STORED_LABEL = "Outcome was not stored." as const;

function formatAgentExecutionOutcomeLabel(outcome: string | null | undefined): string {
  const trimmed = outcome?.trim() ?? "";

  if (trimmed.length === 0) {
    return AGENT_EXECUTION_OUTCOME_NOT_STORED_LABEL;
  }

  return trimmed;
}

function formatAgentResultCollectionCount(
  value: readonly unknown[] | null | undefined,
  labels: { readonly zero: string; readonly one: string; readonly many: (count: number) => string; readonly notStored: string },
): string {
  if (!Array.isArray(value)) {
    return labels.notStored;
  }

  if (value.length === 0) {
    return labels.zero;
  }

  if (value.length === 1) {
    return labels.one;
  }

  return labels.many(value.length);
}

function topologyExemplarLink(summary: RunRetrievalGroundingSummary | null | undefined): ReactElement | null {
  if (summary === null || summary === undefined)
    return null;

  const missing = summary.topologyReferenceArchitectureExemplarMissing === true;
  const rawCount = summary.topologyReferenceArchitectureExemplarCount;
  const countStored = typeof rawCount === "number" && Number.isFinite(rawCount);
  const count = countStored ? Math.trunc(rawCount) : 0;

  if (!missing && !countStored)
    return (
      <p className="m-0 mt-1">
        <a className="font-medium underline underline-offset-2" href="#run-retrieval-exemplar-style-prior">
          Exemplar chunk count was not stored — open retrieval grounding
        </a>
      </p>
    );

  if (!missing && count === 0 && countStored)
    return (
      <p className="m-0 mt-1">
        <a className="font-medium underline underline-offset-2" href="#run-retrieval-exemplar-style-prior">
          0 reference architecture exemplar chunks were stored.
        </a>
      </p>
    );

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
  const [retryAcceptedMessage, setRetryAcceptedMessage] = useState<string | null>(null);

  const resultsMissing = props.results === null || props.results === undefined;
  const outcomes = props.agentExecutionOutcomes?.filter((row) => row !== null && row !== undefined) ?? [];
  const rows = props.results?.filter((row) => row !== null && row !== undefined) ?? [];
  const failedAgentTypes = resolveFailedAgentTypesForSelectiveRetry(outcomes);
  const runId = (props.runId ?? "").trim();
  const canRetryFailed = runId.length > 0 && failedAgentTypes.length > 0;

  const agentResultsEmptyCopy = resultsMissing
    ? "Agent results were not stored."
    : outcomes.length === 0 && rows.length === 0
      ? "Agent results were stored empty."
      : null;

  async function onRetryFailedAgents(): Promise<void> {
    if (!canRetryFailed || retryBusy) {
      return;
    }

    setRetryBusy(true);
    setRetryError(null);
    setRetryAcceptedMessage(null);
    const startedAtMs = Date.now();

    try {
      await executeArchitectureRunSelectiveInFlight(runId, {
        agentTypes: failedAgentTypes,
        includeDependents: true,
      });
      await awaitMinimumVisibleDuration(startedAtMs);
      setRetryAcceptedMessage(
        `Selective retry started for ${failedAgentTypes.length} failed agent${failedAgentTypes.length === 1 ? "" : "s"}. This page updates when the attempt finishes.`,
      );
      router.refresh();
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      const message =
        reviewSelectiveExecuteMutationBlockedReason(failure)
        ?? (error instanceof Error ? error.message : "Selective retry failed.");
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
        {agentResultsEmptyCopy !== null ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {agentResultsEmptyCopy}
          </p>
        ) : null}
        {agentResultsEmptyCopy === null && outcomes.length > 0 ? (
          <ul className="m-0 list-none space-y-2 p-0" data-testid="run-agent-execution-outcomes">
            {outcomes.map((outcome) => {
              const agentKey = (outcome.agentType ?? "unknown").trim() || "unknown";
              const outcomeLabel = formatAgentExecutionOutcomeLabel(outcome.outcome);

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
                    {formatAgentExecutionLimitationSuffix(outcome.degradationReasonCode)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : agentResultsEmptyCopy === null ? (
          <ul className="m-0 list-none space-y-2 p-0">
            {rows.map((result) => {
              const claims = formatAgentResultCollectionCount(result.claims, {
                zero: "0 claims",
                one: "1 claim",
                many: (count) => `${count} claims`,
                notStored: "Claims were not stored.",
              });
              const findings = formatAgentResultCollectionCount(result.findings, {
                zero: "0 findings",
                one: "1 finding",
                many: (count) => `${count} findings`,
                notStored: "Findings were not stored.",
              });
              const evidenceRefs = formatAgentResultCollectionCount(result.evidenceRefs, {
                zero: "0 evidence refs",
                one: "1 evidence ref",
                many: (count) => `${count} evidence refs`,
                notStored: "Evidence refs were not stored.",
              });
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
                    {claims}
                    {" · "}
                    {findings}
                    {" · "}
                    {evidenceRefs}
                    {confidence !== null ? ` · confidence ${confidence}` : " · Agent confidence was not stored."}
                  </p>
                  {result.agentType === "Topology"
                    ? topologyExemplarLink(props.retrievalGroundingSummary)
                    : null}
                </li>
              );
            })}
          </ul>
        ) : null}
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
            {retryAcceptedMessage !== null ? (
              <div
                className={cn(DESIGN_TOKENS.callout.info, "p-3")}
                data-testid="run-agent-selective-retry-outcome"
                role="status"
                aria-live="polite"
              >
                <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{retryAcceptedMessage}</p>
              </div>
            ) : null}
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
