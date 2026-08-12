"use client";

import { cn } from "@/lib/utils";
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
} from "@/lib/buyer/buyer-polish-copy";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
      ? `/architecture/reviews/${encodeURIComponent(runTrim)}`
      : "/architecture/reviews";

  const heading = operatorShell ? OPERATOR_GRAPH_LOAD_ERROR_HEADING : BUYER_EVIDENCE_TRAIL_ERROR_HEADING;
  const body = operatorShell ? OPERATOR_GRAPH_LOAD_ERROR_BODY : BUYER_EVIDENCE_TRAIL_ERROR_BODY;
  const tryNext = operatorShell ? OPERATOR_GRAPH_LOAD_ERROR_TRY_NEXT : BUYER_EVIDENCE_TRAIL_ERROR_TRY_NEXT;

  return (
    <OperatorErrorCallout>
      <strong>{heading}</strong>
      <p className="mt-2">{body}</p>
      <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{tryNext}</p>
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
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/administration/system-health">System health</Link>
        </Button>
      </div>
      <details className={cn("mt-4 rounded-md border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.micro)}>
        <summary className={cn("cursor-pointer select-none text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
          Technical details
        </summary>
        <dl className={cn("m-0 mt-2 space-y-1.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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
              <dt className="inline font-semibold">Review: </dt>
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
