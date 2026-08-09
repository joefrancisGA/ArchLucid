"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type OperatorMutationInlineErrorProps = {
  readonly message: string;
  readonly testId?: string;
  readonly className?: string;
};

/** Inline error for failed high-stakes operator mutations (TB-2114). */
export function OperatorMutationInlineError(props: OperatorMutationInlineErrorProps): React.ReactElement {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [props.message]);

  return (
    <p
      ref={ref}
      tabIndex={-1}
      role="alert"
      data-testid={props.testId ?? "operator-mutation-inline-error"}
      className={cn(
        "m-0 whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100",
        OPERATOR_TYPOGRAPHY.body,
        props.className,
      )}
    >
      {props.message}
    </p>
  );
}
