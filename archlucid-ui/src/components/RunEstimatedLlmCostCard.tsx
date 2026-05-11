"use client";

import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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

/** Read-only run-level LLM cost estimate from summed agent execution traces (operator review detail). */
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

  const usdAvailable =
    typeof rawCost === "number" && Number.isFinite(rawCost) && totalTokens > 0;

  const showPrimaryUnavailable = totalTokens <= 0;

  if (isBuyerPolishedOperatorShellEnv() && showPrimaryUnavailable) {
    return null;
  }

  return (
    <Card className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Estimated LLM cost
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm text-neutral-700 dark:text-neutral-300">
        {showPrimaryUnavailable ? (
          <p className="m-0 text-neutral-600 dark:text-neutral-400">Cost estimate unavailable</p>
        ) : (
          <>
            <p className="m-0 font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
              {usdAvailable ? formatUsd(rawCost as number) : "USD estimate unavailable"}
            </p>
            <dl className="m-0 grid gap-1 sm:grid-cols-[minmax(7rem,auto)_1fr] sm:gap-x-4">
              <dt className="text-neutral-600 dark:text-neutral-400">Prompt tokens</dt>
              <dd className="m-0 justify-self-start tabular-nums sm:justify-self-end">{formatTokens(prompt)}</dd>
              <dt className="text-neutral-600 dark:text-neutral-400">Completion tokens</dt>
              <dd className="m-0 justify-self-start tabular-nums sm:justify-self-end">{formatTokens(completion)}</dd>
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
