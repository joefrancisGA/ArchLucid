import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

import {
  OPERATOR_PAGE_CONTAINER,
  type OperatorPageContainerVariant,
} from "@/lib/design-tokens";

export type OperatorPageContainerProps = HTMLAttributes<HTMLDivElement> & {
  /** Width profile for the page work surface. Defaults to workflow wizard width. */
  variant?: OperatorPageContainerVariant;
  /**
   * Reserve a persistent right context rail on lg+ (guided intake clarifications).
   * Widens the work surface to the dashboard rail without centering.
   */
  withContextRail?: boolean;
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
  function OperatorPageContainer(
    { variant = "workflow", withContextRail = false, className, children, ...rest },
    ref,
  ) {
    const resolvedVariant: OperatorPageContainerVariant =
      withContextRail && variant === "workflow" ? "dashboard" : variant;

    return (
      <div ref={ref} className={operatorPageContainerClass(resolvedVariant, className)} {...rest}>
        {children}
      </div>
    );
  },
);
