"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunAgentExecutionLlmCostEstimate } from "@/types/authority";

function formatUsd(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
}

function formatTokens(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function formatCostEstimationBasis(basis: string): string {
  switch (basis.trim().toLowerCase()) {
    case "estimated-from-configured-rates":
      return "Estimated from configured model rates";
    case "provider-tokens-without-rate":
      return "Token totals only (rate unavailable)";
    case "estimation-disabled":
      return "Estimation disabled on host";
    case "unavailable":
      return "Unavailable";
    default:
      return basis.trim().length > 0 ? basis : "Unavailable";
  }
}

/** Read-only review-level LLM cost and token telemetry from persisted agent execution traces. */
export function RunEstimatedLlmCostCard(props: {
  readonly estimate: RunAgentExecutionLlmCostEstimate | null | undefined;
}): ReactElement | null {
  const payload = props.estimate;

  const prompt = typeof payload?.tokenCounts?.prompt === "number" ? payload.tokenCounts.prompt : 0;
  const completion =
    typeof payload?.tokenCounts?.completion === "number" ? payload.tokenCounts.completion : 0;
  const totalTokens = prompt + completion;
  const rawCost = payload?.estimatedCostUsd;
  const model = typeof payload?.model === "string" ? payload.model.trim() : "";
  const basis =
    typeof payload?.costEstimationBasis === "string" ? payload.costEstimationBasis.trim() : "";

  const usdAvailable =
    typeof rawCost === "number" && Number.isFinite(rawCost) && totalTokens > 0;

  const showPrimaryUnavailable = totalTokens <= 0;

  if (isBuyerPolishedOperatorShellEnv() && showPrimaryUnavailable) {
    return null;
  }

  return (
    <Card
      className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30"
      data-testid="run-cost-telemetry-card"
    >
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Cost &amp; telemetry</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-3 pt-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {showPrimaryUnavailable ? (
          <p className="m-0 text-neutral-600 dark:text-neutral-400">Token telemetry unavailable</p>
        ) : (
          <>
            <p className="m-0 font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
              {usdAvailable ? formatUsd(rawCost as number) : "USD estimate unavailable"}
            </p>
            <dl className="m-0 grid gap-1 sm:grid-cols-[minmax(7rem,auto)_1fr] sm:gap-x-4">
              <dt className="text-neutral-600 dark:text-neutral-400">Total tokens</dt>
              <dd className="m-0 justify-self-start tabular-nums sm:justify-self-end">
                {formatTokens(totalTokens)}
              </dd>
              <dt className="text-neutral-600 dark:text-neutral-400">Prompt tokens</dt>
              <dd className="m-0 justify-self-start tabular-nums sm:justify-self-end">{formatTokens(prompt)}</dd>
              <dt className="text-neutral-600 dark:text-neutral-400">Completion tokens</dt>
              <dd className="m-0 justify-self-start tabular-nums sm:justify-self-end">{formatTokens(completion)}</dd>
              <dt className="text-neutral-600 dark:text-neutral-400">Estimation basis</dt>
              <dd className="m-0 justify-self-start sm:justify-self-end">{formatCostEstimationBasis(basis)}</dd>
            </dl>
          </>
        )}
        {model.length > 0 ? (
          <p className="m-0">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Model / deployment</span>
            {": "}
            <span className="break-words">{model}</span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
