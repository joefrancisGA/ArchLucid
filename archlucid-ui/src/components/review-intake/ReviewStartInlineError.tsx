"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ReviewStartInlineErrorProps = {
  readonly message: string;
  readonly testId?: string;
  readonly className?: string;
};

/** Buyer-safe inline error for failed review-start actions. */
export function ReviewStartInlineError(props: ReviewStartInlineErrorProps): React.ReactElement {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [props.message]);

  return (
    <p
      ref={ref}
      tabIndex={-1}
      role="alert"
      data-testid={props.testId ?? "review-start-inline-error"}
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
