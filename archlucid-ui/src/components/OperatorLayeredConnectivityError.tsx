"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorWarningCallout } from "@/components/OperatorShellMessage";
import { OperatorErrorUiReferenceLine } from "@/components/OperatorErrorUiReferenceLine";
import { OperatorErrorRecoveryActions } from "@/components/usability/OperatorErrorRecoveryActions";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { OperatorReportProblemAction } from "@/components/support/OperatorReportProblemAction";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import {
  OPERATOR_CONNECTIVITY_CHECKLIST_LABEL,
  OPERATOR_CONNECTIVITY_ERROR_PRIMARY_BODY,
  OPERATOR_CONNECTIVITY_ERROR_PRIMARY_HEADING,
  OPERATOR_CONNECTIVITY_TECHNICAL_DETAILS_LABEL,
  resolveOperatorConnectivityTechnicalDetails,
  type OperatorConnectivityPresentationInput,
} from "@/lib/operator/operator-connectivity-error-present";
import { isReportProblemEnabledForConnectivityError } from "@/lib/report-problem-surfaces";

export type OperatorLayeredConnectivityErrorProps = OperatorConnectivityPresentationInput;

/** Buyer-safe connectivity failure — recovery actions first; support detail behind Technical details. */
export function OperatorLayeredConnectivityError(props: OperatorLayeredConnectivityErrorProps) {
  const technical = resolveOperatorConnectivityTechnicalDetails(props);

  if (technical === null) {
    return null;
  }

  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const troubleshootingHref = buyerPolished
    ? resolveInAppDocHref("/docs/runbooks/TROUBLESHOOTING.md")
    : toDocsBlobUrl("/docs/runbooks/TROUBLESHOOTING.md");
  const connectivityChecklistHref = buyerPolished
    ? resolveInAppDocHref("/docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md")
    : toDocsBlobUrl("/docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md");
  const errorCodeAnchor =
    technical.errorCode !== null
      ? `${troubleshootingHref}#${encodeURIComponent(technical.errorCode)}`
      : troubleshootingHref;

  return (
    <OperatorWarningCallout>
      <div data-testid="operator-connectivity-primary">
        <strong>{OPERATOR_CONNECTIVITY_ERROR_PRIMARY_HEADING}</strong>
        <p className="mt-2">{OPERATOR_CONNECTIVITY_ERROR_PRIMARY_BODY}</p>
        <OperatorErrorRecoveryContract presentation={errorRecoveryContractForScenario("connectivity")} />
        <OperatorErrorRecoveryActions helpSlug="troubleshooting" helpHashFragment="overview-workspace-empty" showSystemHealth />
        <div className="mt-3">
          <OperatorReportProblemAction
            enabled={isReportProblemEnabledForConnectivityError()}
            problem={props.problem}
            httpStatus={props.httpStatus}
            correlationId={technical.correlationId}
            errorTitle={OPERATOR_CONNECTIVITY_ERROR_PRIMARY_HEADING}
          />
        </div>
      </div>
      <OperatorErrorUiReferenceLine />
      <details
        className={cn("mt-4 rounded-md border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="operator-connectivity-technical-details"
      >
        <summary className="cursor-pointer select-none font-medium text-neutral-800 dark:text-neutral-200">
          {OPERATOR_CONNECTIVITY_TECHNICAL_DETAILS_LABEL}
        </summary>
        <dl className="m-0 mt-2 space-y-1.5 text-neutral-600 dark:text-neutral-400">
          <div>
            <dt className="inline font-semibold">Error type: </dt>
            <dd className="inline">{technical.errorType}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Cause: </dt>
            <dd className="inline break-all">{technical.cause}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Support reference: </dt>
            <dd className="inline break-all font-mono">{technical.correlationId}</dd>
            <CopyIdButton value={technical.correlationId} aria-label="Copy request ID" />
          </div>
          {technical.httpStatus !== null ? (
            <div>
              <dt className="inline font-semibold">HTTP status: </dt>
              <dd className="inline">{technical.httpStatus}</dd>
            </div>
          ) : null}
          {technical.endpointLine !== null ? (
            <div>
              <dt className="inline font-semibold">Endpoint: </dt>
              <dd className="inline break-all font-mono">{technical.endpointLine}</dd>
            </div>
          ) : null}
          <div>
            <dt className="inline font-semibold">Configuration: </dt>
            <dd className="inline">{technical.configurationHint}</dd>
          </div>
          {technical.localDevConfigurationHint !== null ? (
            <div>
              <dt className="inline font-semibold">Local configuration: </dt>
              <dd className="inline break-all">{technical.localDevConfigurationHint}</dd>
            </div>
          ) : null}
          {technical.errorCode !== null ? (
            <div>
              <dt className="inline font-semibold">Error code: </dt>
              <dd className="inline font-mono">{technical.errorCode}</dd>
            </div>
          ) : null}
          <div>
            <dt className="inline font-semibold">Guides: </dt>
            <dd className="inline">
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
                href={connectivityChecklistHref}
                {...(buyerPolished ? {} : { rel: "noopener noreferrer", target: "_blank" })}
              >
                {OPERATOR_CONNECTIVITY_CHECKLIST_LABEL}
              </a>
              {technical.errorCode !== null ? (
                <>
                  {" · "}
                  <a
                    className="underline"
                    href={errorCodeAnchor}
                    {...(buyerPolished ? {} : { rel: "noopener noreferrer", target: "_blank" })}
                  >
                    {technical.errorCode} remediation
                  </a>
                </>
              ) : null}
            </dd>
          </div>
        </dl>
      </details>
    </OperatorWarningCallout>
  );
}
