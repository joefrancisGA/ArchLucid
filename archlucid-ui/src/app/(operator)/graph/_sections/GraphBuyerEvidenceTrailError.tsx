"use client";

import Link from "next/link";

import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import { OperatorErrorCallout } from "@/components/OperatorShellMessage";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  BUYER_EVIDENCE_TRAIL_ERROR_BODY,
  BUYER_EVIDENCE_TRAIL_ERROR_HEADING,
  BUYER_EVIDENCE_TRAIL_ERROR_TRY_NEXT,
  BUYER_EVIDENCE_TRAIL_OPEN_PACKAGE,
  OPERATOR_GRAPH_LOAD_ERROR_BODY,
  OPERATOR_GRAPH_LOAD_ERROR_HEADING,
  OPERATOR_GRAPH_LOAD_ERROR_TRY_NEXT,
} from "@/lib/buyer-polish-copy";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";

export type GraphBuyerEvidenceTrailErrorProps = {
  failure: ApiLoadFailureState;
  runId: string;
  onRetry: () => void;
  loading: boolean;
  graphEndpointHint?: string;
  /** When true, use operator-shell graph load copy instead of buyer connectivity wording. */
  operatorShell?: boolean;
};

/** Load failure — one primary surface with recovery actions; HTTP detail behind Technical details. */
export function GraphBuyerEvidenceTrailError(props: GraphBuyerEvidenceTrailErrorProps) {
  const { failure, runId, onRetry, loading, graphEndpointHint, operatorShell = false } = props;
  const correlationId = ensureCorrelationId(failure.correlationId ?? failure.problem?.correlationId);
  const httpStatus = failure.httpStatus ?? failure.problem?.status ?? null;
  const troubleshootingHref = resolveInAppDocHref("/docs/runbooks/TROUBLESHOOTING.md");
  const runTrim = runId.trim();
  const reviewPackageHref =
    runTrim.length > 0
      ? `/reviews/${encodeURIComponent(runTrim)}`
      : "/reviews?projectId=default";

  const heading = operatorShell ? OPERATOR_GRAPH_LOAD_ERROR_HEADING : BUYER_EVIDENCE_TRAIL_ERROR_HEADING;
  const body = operatorShell ? OPERATOR_GRAPH_LOAD_ERROR_BODY : BUYER_EVIDENCE_TRAIL_ERROR_BODY;
  const tryNext = operatorShell ? OPERATOR_GRAPH_LOAD_ERROR_TRY_NEXT : BUYER_EVIDENCE_TRAIL_ERROR_TRY_NEXT;

  return (
    <OperatorErrorCallout>
      <strong>{heading}</strong>
      <p className="mt-2">{body}</p>
      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{tryNext}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" disabled={loading} onClick={onRetry}>
          Retry
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={reviewPackageHref}>{BUYER_EVIDENCE_TRAIL_OPEN_PACKAGE}</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={troubleshootingHref}>Open troubleshooting</Link>
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/health">System health</Link>
        </Button>
      </div>
      <details className="mt-4 rounded-md border border-neutral-200 bg-white/60 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-900/50">
        <summary className="cursor-pointer select-none font-medium text-neutral-800 dark:text-neutral-200">
          Technical details
        </summary>
        <dl className="m-0 mt-2 space-y-1.5 text-neutral-600 dark:text-neutral-400">
          {httpStatus !== null ? (
            <div>
              <dt className="inline font-semibold">HTTP </dt>
              <dd className="inline">{httpStatus}</dd>
            </div>
          ) : null}
          <div>
            <dt className="inline font-semibold">Request ID: </dt>
            <dd className="inline break-all font-mono">{correlationId}</dd>
            <CopyIdButton value={correlationId} aria-label="Copy request ID" />
          </div>
          {graphEndpointHint !== undefined && graphEndpointHint.trim().length > 0 ? (
            <div>
              <dt className="inline font-semibold">Endpoint: </dt>
              <dd className="inline break-all font-mono">{graphEndpointHint}</dd>
            </div>
          ) : null}
          {runTrim.length > 0 ? (
            <div>
              <dt className="inline font-semibold">Review package: </dt>
              <dd className="inline break-all font-mono">{runTrim}</dd>
            </div>
          ) : null}
          {failure.problem?.errorCode ? (
            <div>
              <dt className="inline font-semibold">Error code: </dt>
              <dd className="inline font-mono">{failure.problem.errorCode}</dd>
            </div>
          ) : null}
          <div>
            <dt className="inline font-semibold">Diagnostics: </dt>
            <dd className="inline">
              Check the browser network tab for the failing graph endpoint. See{" "}
              <Link className="underline" href={troubleshootingHref}>
                Troubleshooting runbook
              </Link>
              .
            </dd>
          </div>
        </dl>
      </details>
    </OperatorErrorCallout>
  );
}
