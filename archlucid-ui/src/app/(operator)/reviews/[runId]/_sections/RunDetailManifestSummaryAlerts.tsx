import type { ReactElement } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorMalformedCallout } from "@/components/OperatorShellMessage";
import { OperatorSectionRetryButton } from "@/components/OperatorSectionRetryButton";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";

type RunDetailManifestSummaryAlertsProps = {
  readonly manifestSummaryFailure: ApiLoadFailureState | null;
  readonly manifestSummaryMalformed: string | null;
};

export function RunDetailManifestSummaryAlerts(
  props: RunDetailManifestSummaryAlertsProps,
): ReactElement | null {
  const { manifestSummaryFailure, manifestSummaryMalformed } = props;

  if (!manifestSummaryFailure && !manifestSummaryMalformed) {
    return null;
  }

  return (
    <>
      {manifestSummaryFailure ? (
        <div className="space-y-2">
          <p className="m-0 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Manifest summary could not be loaded.
          </p>
          <OperatorApiProblem
            problem={manifestSummaryFailure.problem}
            fallbackMessage={manifestSummaryFailure.message}
            correlationId={manifestSummaryFailure.correlationId}
            variant="warning"
          />
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            This is a failed request (HTTP / transport / 404), not a malformed JSON body.
          </p>
          <OperatorSectionRetryButton label="Retry loading manifest summary" />
        </div>
      ) : null}

      {manifestSummaryMalformed ? (
        <OperatorMalformedCallout>
          <strong>Manifest summary response was not usable.</strong>
          <p className="mt-2">{manifestSummaryMalformed}</p>
        </OperatorMalformedCallout>
      ) : null}
    </>
  );
}
