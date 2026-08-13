import type { ReactElement } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type BaselineFieldMessageProps = {
  readonly error: string | null;
  readonly warning?: string | null;
};

/** Inline field validation helper shared by baseline settings and pilot wizard (TB-2007). */
export function BaselineFieldMessage(props: BaselineFieldMessageProps): ReactElement | null {
  if (props.error) {
    return (
      <p className={cn("m-0 mt-1 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
        {props.error}
      </p>
    );
  }

  if (props.warning) {
    return (
      <p className={cn("m-0 mt-1 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)} role="status">
        {props.warning}
      </p>
    );
  }

  return null;
}
