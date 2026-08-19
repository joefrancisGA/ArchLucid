"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CopyIdButton } from "@/components/CopyIdButton";
import { ApiValidationFieldErrorList } from "@/components/ApiValidationFieldErrorList";
import type { ApiValidationFieldError } from "@/lib/api-validation-problem";

export type ApiErrorToastContentProps = {
  readonly title: string;
  readonly detail?: string | null;
  readonly endpointLine?: string | null;
  readonly validationFields?: readonly ApiValidationFieldError[];
  readonly correlationId?: string | null;
};

/** Sonner toast body for API failures — surfaces correlation id with one-click copy. */
export function ApiErrorToastContent(props: ApiErrorToastContentProps) {
  const trimmedCorrelation = props.correlationId?.trim() ?? "";
  const detail = props.detail?.trim() ?? "";
  const endpointLine = props.endpointLine?.trim() ?? "";
  const hasValidationFields = (props.validationFields?.length ?? 0) > 0;

  return (
    <div className={cn("flex max-w-md flex-col gap-2", OPERATOR_TYPOGRAPHY.body)} data-testid="api-error-toast-content">
      <p className="m-0 font-semibold text-red-900 dark:text-red-100">{props.title}</p>
      {endpointLine.length > 0 ? (
        <p className={cn("m-0 font-mono text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{endpointLine}</p>
      ) : null}
      {hasValidationFields ? (
        <ApiValidationFieldErrorList fieldErrors={props.validationFields ?? []} testId="api-error-toast-validation" />
      ) : null}
      {!hasValidationFields && detail.length > 0 ? (
        <p className="m-0 text-neutral-700 dark:text-neutral-300">{detail}</p>
      ) : null}
      {trimmedCorrelation.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">
          <span className={cn("font-semibold text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>Correlation ID</span>
          <code className={cn("max-w-[14rem] truncate rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>
            {trimmedCorrelation}
          </code>
          <CopyIdButton value={trimmedCorrelation} aria-label="Copy correlation ID" />
        </div>
      ) : null}
    </div>
  );
}
