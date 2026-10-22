"use client";

import type { ReactElement } from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { formatLivelihoodLastSavedLabel } from "@/lib/livelihood-last-saved-label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type LivelihoodPersistSaveStatusProps = {
  readonly lastSavedUtc: string | null;
  readonly inlineSaveError: string | null;
  readonly testId?: string;
  readonly className?: string;
};

/** Last-saved chrome + TB-2155 inline retry for livelihood editor saves (SD-08). */
export function LivelihoodPersistSaveStatus(props: LivelihoodPersistSaveStatusProps): ReactElement | null {
  const testId = props.testId ?? "livelihood-persist-save-status";

  if (props.inlineSaveError === null && props.lastSavedUtc === null) {
    return null;
  }

  return (
    <div className={cn("space-y-2", props.className)} data-testid={`${testId}-wrapper`}>
      {props.inlineSaveError !== null ? (
        <OperatorMutationInlineError
          message={props.inlineSaveError}
          testId={`${testId}-inline-save-error`}
          recoveryScenario="api-problem"
        />
      ) : null}
      {props.lastSavedUtc !== null ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${testId}-last-saved`}
          role="status"
        >
          {formatLivelihoodLastSavedLabel(props.lastSavedUtc)}
        </p>
      ) : null}
    </div>
  );
}
