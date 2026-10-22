import type { ReactElement } from "react";

import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type BaselineFieldMessageProps = {
  readonly error: string | null;
  readonly warning?: string | null;
  /** Stable id for `aria-describedby` on the paired input. */
  readonly id?: string;
};

/** Inline field validation helper shared by baseline settings and pilot wizard (TB-2007). */
export function BaselineFieldMessage(props: BaselineFieldMessageProps): ReactElement | null {
  if (props.error) {
    return (
      <p
        id={props.id}
        className={cn(
          "m-0 mt-1 flex items-start gap-1.5 font-medium text-red-700 dark:text-red-300",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        role="alert"
      >
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{props.error}</span>
      </p>
    );
  }

  if (props.warning) {
    return (
      <p
        id={props.id}
        className={cn("m-0 mt-1 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
        role="status"
      >
        {props.warning}
      </p>
    );
  }

  return null;
}
