"use client";

import type { ReactElement, ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorInventoryRowMoreActionsProps = {
  readonly primaryActions: ReactNode;
  readonly overflowActions: ReactNode;
  readonly overflowMenuLabel?: string;
  readonly testId?: string;
};

/** TB-1646 / TB-1649 — keep ≤2 visible row actions; tuck the rest under a disclosure menu. */
export function OperatorInventoryRowMoreActions(props: OperatorInventoryRowMoreActionsProps): ReactElement {
  return (
    <div className="flex flex-wrap items-start gap-2">
      {props.primaryActions}
      <details className="min-w-[8rem]">
        <summary
          className={cn(
            "inline-flex cursor-pointer list-none items-center rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900",
            OPERATOR_TYPOGRAPHY.helper,
            "[&::-webkit-details-marker]:hidden",
          )}
          data-testid={props.testId}
        >
          {props.overflowMenuLabel ?? "More actions"}
        </summary>
        <div className={cn("mt-2 flex flex-wrap gap-2", OPERATOR_TYPOGRAPHY.helper)}>{props.overflowActions}</div>
      </details>
    </div>
  );
}
