"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ApiValidationFieldError } from "@/lib/api-validation-problem";
import { formatValidationFieldKey } from "@/lib/api-validation-problem";

export type ApiValidationFieldErrorListProps = {
  readonly fieldErrors: readonly ApiValidationFieldError[];
  readonly testId?: string;
};

/** Field-scoped API validation messages for operator surfaces (callout + toast). */
export function ApiValidationFieldErrorList(props: ApiValidationFieldErrorListProps): React.JSX.Element | null {
  if (props.fieldErrors.length === 0) {
    return null;
  }

  return (
    <ul
      className="m-0 list-none space-y-2 p-0"
      data-testid={props.testId ?? "api-validation-field-errors"}
    >
      {props.fieldErrors.map((entry) => {
        const label = formatValidationFieldKey(entry.field);

        return (
          <li
            key={`${entry.field}:${entry.messages.join("|")}`}
            className={cn("rounded-md border border-red-200 bg-red-50/80 px-3 py-2 dark:border-red-900/60 dark:bg-red-950/30", OPERATOR_TYPOGRAPHY.body)}
          >
            <p className={cn("m-0 font-mono font-semibold uppercase tracking-wide text-red-900 dark:text-red-200", OPERATOR_TYPOGRAPHY.helper)}>
              {label}
            </p>
            <ul className="m-0 mt-1 list-disc space-y-1 pl-4 text-neutral-800 dark:text-neutral-200">
              {entry.messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
