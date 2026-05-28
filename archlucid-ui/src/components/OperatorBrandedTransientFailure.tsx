"use client";

import Link from "next/link";

import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorSectionRetryButton } from "@/components/OperatorSectionRetryButton";
import { OperatorWarningCallout } from "@/components/OperatorShellMessage";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiTimeoutLoadFailure } from "@/lib/api-load-failure";
import { operatorCopyForProblem } from "@/lib/api-problem-copy";

export type OperatorBrandedTransientFailureProps = {
  readonly failure?: ApiLoadFailureState | null;
  readonly retryLabel?: string;
};

/**
 * Buyer-safe recovery when ArchLucid or the API is slow or temporarily unreachable — not a missing deep link.
 */
export function OperatorBrandedTransientFailure({
  failure = null,
  retryLabel = "Retry",
}: OperatorBrandedTransientFailureProps) {
  const timedOut = isApiTimeoutLoadFailure(failure);
  const title = timedOut ? "ArchLucid is taking longer than expected" : "ArchLucid is temporarily unavailable";
  const defaultBody = timedOut
    ? "The server did not respond in time. This is usually temporary — retry in a moment, or return to Reviews while processing continues."
    : "We could not reach the service just now. Confirm the API is running, wait a short time, then retry.";
  const problemCopy =
    failure !== null
      ? operatorCopyForProblem(failure.problem, failure.message, {
          httpStatus: failure.httpStatus,
          retryAfterSeconds: failure.retryAfterSeconds,
        })
      : null;
  const body = problemCopy?.hint?.trim() ?? problemCopy?.body?.trim() ?? defaultBody;
  const correlationId = failure?.correlationId?.trim() ?? "";
  const footerLabel = timedOut ? "TIMEOUT" : "UNAVAILABLE";

  return (
    <div role="alert" aria-live="assertive">
    <OperatorWarningCallout>
      <strong className="text-base">{title}</strong>
      <p className="mt-2 text-sm leading-relaxed">{body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <OperatorSectionRetryButton label={retryLabel} />
        <Link className="text-sm font-medium text-teal-900 underline dark:text-teal-300" href="/">
          Home
        </Link>
        <Link
          className="text-sm font-medium text-teal-900 underline dark:text-teal-300"
          href="/reviews?projectId=default"
        >
          Reviews
        </Link>
        <Link className="text-sm font-medium text-teal-900 underline dark:text-teal-300" href="/help">
          Help
        </Link>
      </div>
      {correlationId.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
          <span className="font-semibold">Need support?</span>
          <span>Provide correlation ID</span>
          <code className="break-all rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">{correlationId}</code>
          <CopyIdButton value={correlationId} aria-label="Copy correlation ID" />
        </div>
      ) : null}
      <p className="m-0 mt-6 text-[11px] uppercase tracking-wide text-neutral-800 dark:text-neutral-300">
        ArchLucid · {footerLabel}
      </p>
      <span data-testid="branded-transient-failure" className="sr-only">
        {timedOut ? "Request timed out" : "Service temporarily unavailable"}
      </span>
    </OperatorWarningCallout>
    </div>
  );
}
