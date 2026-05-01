"use client";

import type { ApiProblemDetails } from "@/lib/api-problem";
import { operatorCopyForProblem } from "@/lib/api-problem-copy";
import { OperatorErrorCallout, OperatorWarningCallout } from "@/components/OperatorShellMessage";
import { OperatorErrorUiReferenceLine } from "@/components/OperatorErrorUiReferenceLine";
import { CopyIdButton } from "@/components/CopyIdButton";

type OperatorApiProblemProps = {
  problem: ApiProblemDetails | null;
  fallbackMessage: string;
  correlationId?: string | null;
  /** Use warning styling for non-fatal secondary failures (e.g. manifest summary on run detail). */
  variant?: "error" | "warning";
};

/**
 * Renders API failures using Problem Details (`errorCode`, `supportHint`) when available,
 * plus optional correlation id (response header and/or problem JSON) for support triage.
 */
export function OperatorApiProblem({
  problem,
  fallbackMessage,
  correlationId,
  variant = "error",
}: OperatorApiProblemProps) {
  const { heading, body, hint } = operatorCopyForProblem(problem, fallbackMessage);
  const Callout = variant === "warning" ? OperatorWarningCallout : OperatorErrorCallout;
  const trimmedCorrelation = correlationId?.trim();

  return (
    <Callout>
      <strong>{heading}</strong>
      <p className="mt-2">{body}</p>
      {hint ? (
        <p className="mt-2.5 text-sm leading-normal">{hint}</p>
      ) : null}
      <OperatorErrorUiReferenceLine />
      {trimmedCorrelation && trimmedCorrelation.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <p className="m-0 flex min-w-0 flex-1 flex-wrap items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="shrink-0 font-semibold">Need support?</span>
            <span className="shrink-0">Provide correlation ID</span>
            <code className="break-all rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">{trimmedCorrelation}</code>
            <span className="shrink-0">with steps to reproduce.</span>
          </p>
          <CopyIdButton value={trimmedCorrelation} aria-label="Copy correlation ID" />
        </div>
      ) : null}
    </Callout>
  );
}
