"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ApiValidationFieldErrorList } from "@/components/ApiValidationFieldErrorList";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { operatorCopyForProblem } from "@/lib/api-problem-copy";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { classifyOperatorConnectivityFailure } from "@/lib/operator/operator-connectivity-error-present";
import { OperatorErrorCallout, OperatorWarningCallout } from "@/components/OperatorShellMessage";
import { OperatorErrorUiReferenceLine } from "@/components/OperatorErrorUiReferenceLine";
import { OperatorLayeredConnectivityError } from "@/components/OperatorLayeredConnectivityError";
import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorErrorRecoveryActions } from "@/components/usability/OperatorErrorRecoveryActions";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { OperatorReportProblemAction } from "@/components/support/OperatorReportProblemAction";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";
import { isReportProblemEnabledForApiProblemFailure } from "@/lib/report-problem-surfaces";

type OperatorApiProblemFromFailure = {
  failure: ApiLoadFailureState;
  variant?: "error" | "warning";
};

type OperatorApiProblemManual = {
  problem: ApiProblemDetails | null | undefined;
  fallbackMessage: string;
  correlationId?: string | null;
  httpStatus?: number | null;
  retryAfterSeconds?: number | null;
  variant?: "error" | "warning";
};

export type OperatorApiProblemProps = OperatorApiProblemFromFailure | OperatorApiProblemManual;

function isFromFailure(props: OperatorApiProblemProps): props is OperatorApiProblemFromFailure {
  return "failure" in props;
}

/**
 * Renders API failures using Problem Details (`errorCode`, `supportHint`) when available,
 * plus optional correlation id (response header and/or problem JSON) for support triage.
 * Pass **`failure`** to thread a full {@link ApiLoadFailureState} from `toApiLoadFailure` (includes 429 / Retry-After).
 */
export function OperatorApiProblem(props: OperatorApiProblemProps) {
  const variant = props.variant ?? "error";

  let problem: ApiProblemDetails | null;
  let fallbackMessage: string;
  let correlationId: string | null;
  let httpStatus: number | null;
  let retryAfterSeconds: number | null;

  if (isFromFailure(props)) {
    problem = props.failure.problem ?? null;
    fallbackMessage = props.failure.message;
    correlationId = props.failure.correlationId;
    httpStatus = props.failure.httpStatus;
    retryAfterSeconds = props.failure.retryAfterSeconds;
  } else {
    problem = props.problem ?? null;
    fallbackMessage = props.fallbackMessage;
    correlationId = props.correlationId ?? problem?.correlationId ?? null;
    httpStatus = props.httpStatus ?? null;
    retryAfterSeconds = props.retryAfterSeconds ?? null;
  }

  const connectivityKind = classifyOperatorConnectivityFailure({
    message: fallbackMessage,
    httpStatus,
    problem,
    correlationId,
  });

  if (connectivityKind !== null) {
    return (
      <OperatorLayeredConnectivityError
        message={fallbackMessage}
        httpStatus={httpStatus}
        problem={problem}
        correlationId={correlationId}
      />
    );
  }

  const { heading, body, hint, endpointLine, validationFields, isValidationFailure } = operatorCopyForProblem(
    problem,
    fallbackMessage,
    {
      httpStatus,
      retryAfterSeconds,
    },
  );
  const Callout = variant === "warning" ? OperatorWarningCallout : OperatorErrorCallout;
  const trimmedCorrelation = ensureCorrelationId(correlationId ?? problem?.correlationId);
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const troubleshootingHref = buyerPolished
    ? resolveInAppDocHref("/docs/runbooks/TROUBLESHOOTING.md")
    : toDocsBlobUrl("/docs/runbooks/TROUBLESHOOTING.md");
  const triageHref = buyerPolished
    ? resolveInAppDocHref("/docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md")
    : toDocsBlobUrl("/docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md");

  return (
    <Callout>
      <strong>{heading}</strong>
      {endpointLine ? (
        <p className={cn("mt-2 font-mono leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{endpointLine}</p>
      ) : null}
      {isValidationFailure && validationFields && validationFields.length > 0 ? (
        <div className="mt-3">
          <ApiValidationFieldErrorList fieldErrors={validationFields} testId="operator-api-problem-validation" />
        </div>
      ) : (
        <p className="mt-2">{body}</p>
      )}
      {hint ? (
        <p className={cn("mt-2.5 leading-normal", OPERATOR_TYPOGRAPHY.body)}>{hint}</p>
      ) : null}
      <OperatorErrorRecoveryContract
        presentation={errorRecoveryContractForScenario("api-problem", { failureSummary: heading })}
      />
      <OperatorErrorUiReferenceLine />
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <p className={cn("m-0 flex min-w-0 flex-1 flex-wrap items-center gap-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="shrink-0 font-semibold">Need support?</span>
          <span className="shrink-0">Provide request ID</span>
          <code className="break-all rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">{trimmedCorrelation}</code>
          <span className="shrink-0">with steps to reproduce.</span>
        </p>
        <CopyIdButton value={trimmedCorrelation} aria-label="Copy request ID" />
        <OperatorReportProblemAction
          enabled={isReportProblemEnabledForApiProblemFailure({ httpStatus, isValidationFailure: isValidationFailure ?? false })}
          problem={problem}
          httpStatus={httpStatus}
          correlationId={correlationId}
          errorTitle={heading}
        />
      </div>
      <OperatorErrorRecoveryActions helpSlug="troubleshooting" />
      <p className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {problem?.errorCode ? (
          <>
            <span className="font-medium">How to fix:</span> see{" "}
            <a className="underline" href={`${troubleshootingHref}#${encodeURIComponent(problem.errorCode)}`}>
              troubleshooting for {problem.errorCode}
            </a>
            {" · "}
          </>
        ) : null}
        Recovery:{" "}
        <a
          className="underline"
          href={troubleshootingHref}
          {...(buyerPolished ? {} : { rel: "noopener noreferrer", target: "_blank" })}
        >
          Troubleshooting guide
        </a>
        {" · "}
        <a
          className="underline"
          href={triageHref}
          {...(buyerPolished ? {} : { rel: "noopener noreferrer", target: "_blank" })}
        >
          Support diagnostics
        </a>
      </p>
    </Callout>
  );
}
