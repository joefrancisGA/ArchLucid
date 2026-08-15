"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { Button } from "@/components/ui/button";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { BuildReportProblemContextInput } from "@/lib/report-problem-context";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";
import { cn } from "@/lib/utils";

export type EnterpriseInlineErrorDiagnostics = {
  readonly attemptedAtUtc: string;
  readonly correlationId: string | null;
  readonly errorCode: string | null;
  readonly httpStatus: number | null;
};

export type EnterpriseInlineErrorNotificationProps = {
  readonly title: string;
  readonly description: ReactNode;
  readonly testId?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly diagnostics?: EnterpriseInlineErrorDiagnostics | null;
  readonly reportProblem: BuildReportProblemContextInput & { readonly surfaceId: string };
};

/** Distinct inline failure surface — role=alert, error icon, optional diagnostics disclosure (GOF P0-2 / P0-3). */
export function EnterpriseInlineErrorNotification(
  props: EnterpriseInlineErrorNotificationProps,
): ReactElement {
  const {
    title,
    description,
    testId,
    onRetry,
    retryLabel = "Retry load",
    diagnostics,
    reportProblem,
  } = props;
  const correlationId =
    diagnostics?.correlationId !== undefined && diagnostics.correlationId !== null
      ? ensureCorrelationId(diagnostics.correlationId)
      : ensureCorrelationId(reportProblem.correlationId);

  return (
    <div
      role="alert"
      data-testid={testId}
      className={cn(
        "rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-3 dark:border-rose-800/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
    >
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-rose-700 dark:text-rose-300"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {title}
          </h3>
          <div className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{description}</div>

          {onRetry !== undefined ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              data-testid="governance-findings-retry-load"
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          ) : null}

          {diagnostics !== undefined && diagnostics !== null ? (
            <details
              className="max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30"
              data-testid="enterprise-inline-error-diagnostics"
            >
              <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                Diagnostic details
              </summary>
              <dl
                className={cn(
                  "m-0 mt-2 grid gap-2 text-al-text-secondary",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
              >
                <div>
                  <dt className="font-medium text-al-text-primary">Attempt time (UTC)</dt>
                  <dd className="m-0 mt-0.5 font-mono">{diagnostics.attemptedAtUtc}</dd>
                </div>
                <div>
                  <dt className="font-medium text-al-text-primary">Request ID</dt>
                  <dd className="m-0 mt-0.5 flex flex-wrap items-center gap-2">
                    <code className="break-all rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">
                      {correlationId}
                    </code>
                    <CopyIdButton value={correlationId} aria-label="Copy request ID" />
                  </dd>
                </div>
                {diagnostics.errorCode !== null && diagnostics.errorCode.trim().length > 0 ? (
                  <div>
                    <dt className="font-medium text-al-text-primary">Error code</dt>
                    <dd className="m-0 mt-0.5 flex flex-wrap items-center gap-2">
                      <code className="break-all rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">
                        {diagnostics.errorCode}
                      </code>
                      <CopyIdButton value={diagnostics.errorCode} aria-label="Copy error code" />
                    </dd>
                  </div>
                ) : null}
                {diagnostics.httpStatus !== null ? (
                  <div>
                    <dt className="font-medium text-al-text-primary">HTTP status</dt>
                    <dd className="m-0 mt-0.5 font-mono">{diagnostics.httpStatus}</dd>
                  </div>
                ) : null}
              </dl>
            </details>
          ) : null}

          <FatalPageReportProblemSupportRow {...reportProblem} />
        </div>
      </div>
    </div>
  );
}
