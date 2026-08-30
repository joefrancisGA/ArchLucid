"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ReviewStartInlineNoticeProps = {
  readonly message: string;
  readonly testId?: string;
  readonly className?: string;
};

/** Buyer-safe inline confirmation for review-start actions (draft saved, demo loaded, etc.). */
export function ReviewStartInlineNotice(props: ReviewStartInlineNoticeProps): React.ReactElement {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [props.message]);

  return (
    <p
      ref={ref}
      tabIndex={-1}
      role="status"
      data-testid={props.testId ?? "review-start-inline-notice"}
      className={cn(
        "m-0 whitespace-pre-wrap rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
        OPERATOR_TYPOGRAPHY.body,
        props.className,
      )}
    >
      {props.message}
    </p>
  );
}
