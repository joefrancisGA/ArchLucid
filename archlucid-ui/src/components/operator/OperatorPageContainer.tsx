import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

import {
  OPERATOR_PAGE_CONTAINER,
  type OperatorPageContainerVariant,
} from "@/lib/design-tokens";

export type OperatorPageContainerProps = HTMLAttributes<HTMLDivElement> & {
  /** Width profile for the page work surface. Defaults to workflow wizard width. */
  variant?: OperatorPageContainerVariant;
};

export function operatorPageContainerClass(
  variant: OperatorPageContainerVariant = "workflow",
  className?: string,
): string {
  return cn(OPERATOR_PAGE_CONTAINER.base, OPERATOR_PAGE_CONTAINER.variant[variant], className);
}

/**
 * Left-aligned operator work surface. Use on workflow pages instead of `mx-auto max-w-*` centering.
 * Shell padding lives in {@link AppShellClient}; nested measure caps on short dashboard helpers
 * are discouraged — prefer full work-surface width (Overview fix 2026-08-04; **TB-2038**–**TB-2041**).
 */
export const OperatorPageContainer = forwardRef<HTMLDivElement, OperatorPageContainerProps>(
  function OperatorPageContainer({ variant = "workflow", className, children, ...rest }, ref) {
    return (
      <div ref={ref} className={operatorPageContainerClass(variant, className)} {...rest}>
        {children}
      </div>
    );
  },
);
