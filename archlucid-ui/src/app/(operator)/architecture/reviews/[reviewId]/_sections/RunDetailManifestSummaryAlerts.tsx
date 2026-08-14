import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorMalformedCallout } from "@/components/operator/OperatorShellMessage";
import { OperatorSectionRetryButton } from "@/components/operator/OperatorSectionRetryButton";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Review record summary could not be loaded.
          </p>
          <OperatorApiProblem
            problem={manifestSummaryFailure.problem}
            fallbackMessage={manifestSummaryFailure.message}
            correlationId={manifestSummaryFailure.correlationId}
            variant="warning"
          />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            This is a failed request (HTTP / transport / 404), not a malformed JSON body.
          </p>
          <OperatorSectionRetryButton label="Retry loading review record summary" />
        </div>
      ) : null}

      {manifestSummaryMalformed ? (
        <OperatorMalformedCallout>
          <strong>Review record summary response was not usable.</strong>
          <p className="mt-2">{manifestSummaryMalformed}</p>
        </OperatorMalformedCallout>
      ) : null}
    </>
  );
}
