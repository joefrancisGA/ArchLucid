"use client";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { isApiRequestError } from "@/lib/api-request-error";

export type WizardSubmitProblemProps = {
  /** Whatever the create-run path threw — an `ApiRequestError` or an arbitrary value. */
  readonly error: unknown;
};

const WIZARD_SUBMIT_FALLBACK_MESSAGE = "Request failed.";

function unstructuredErrorMessage(error: unknown): string {
  if (error !== null && typeof error === "object" && "message" in error) {
    return String((error as { message?: string }).message);
  }

  return WIZARD_SUBMIT_FALLBACK_MESSAGE;
}

/** Renders a wizard submit failure as Problem Details when the API supplied them, message-only otherwise. */
export function WizardSubmitProblem(props: WizardSubmitProblemProps): React.ReactElement {
  const { error } = props;

  if (isApiRequestError(error)) {
    return (
      <OperatorApiProblem
        problem={error.problem}
        fallbackMessage={error.message}
        correlationId={error.correlationId}
        httpStatus={error.httpStatus}
        retryAfterSeconds={error.retryAfterSeconds}
      />
    );
  }

  return <OperatorApiProblem problem={null} fallbackMessage={unstructuredErrorMessage(error)} />;
}
