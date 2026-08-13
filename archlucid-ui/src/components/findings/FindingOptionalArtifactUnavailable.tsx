"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import { OperatorErrorCallout } from "@/components/operator/OperatorShellMessage";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingOptionalArtifactUnavailableProps = {
  readonly heading: string;
  readonly body: string;
  readonly tryNext?: string | null;
  readonly onRetry?: () => void;
  readonly loading?: boolean;
  readonly showRetry?: boolean;
  readonly recoveryLinks?: readonly { readonly href: string; readonly label: string }[];
  readonly failure?: ApiLoadFailureState | null;
  readonly buyerPolishedShell?: boolean;
};

/** Graceful empty state for optional finding artifacts — no raw HTTP in the primary surface. */
export function FindingOptionalArtifactUnavailable(
  props: FindingOptionalArtifactUnavailableProps,
): React.JSX.Element {
  const correlationId = ensureCorrelationId(props.failure?.correlationId ?? props.failure?.problem?.correlationId);
  const httpStatus = props.failure?.httpStatus ?? props.failure?.problem?.status ?? null;
  const showTechnicalDetails = props.buyerPolishedShell !== true && props.failure !== null && props.failure !== undefined;

  return (
    <OperatorErrorCallout>
      <strong>{props.heading}</strong>
      <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{props.body}</p>
      {props.tryNext !== null && props.tryNext !== undefined && props.tryNext.length > 0 ? (
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.tryNext}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {props.showRetry === true && props.onRetry !== undefined ? (
          <Button type="button" variant="primary" size="sm" disabled={props.loading === true} onClick={props.onRetry}>
            Retry
          </Button>
        ) : null}
        {(props.recoveryLinks ?? []).map((link) => (
          <Button key={link.href} type="button" variant="outline" size="sm" asChild>
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </div>
      {showTechnicalDetails ? (
        <details
          className={cn(
            "mt-4 rounded-md border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/50",
            OPERATOR_TYPOGRAPHY.micro,
          )}
        >
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
          </dl>
        </details>
      ) : null}
    </OperatorErrorCallout>
  );
}
