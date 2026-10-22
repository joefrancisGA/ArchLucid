"use client";

import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildCancelAbandonInFlightClarity } from "@/lib/operations/cancel-abandon-in-flight-clarity";
import { cn } from "@/lib/utils";

export type ShellInFlightCancelAbandonClarityProps = {
  readonly className?: string;
};

/**
 * Compact wait / leave / stop clarity strip for the shell in-flight operations popover (TB-2225).
 */
export function ShellInFlightCancelAbandonClarity(
  props: ShellInFlightCancelAbandonClarityProps,
): ReactElement {
  const clarity = buildCancelAbandonInFlightClarity();

  return (
    <section
      className={cn(
        "space-y-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700",
        props.className,
      )}
      data-testid="shell-in-flight-cancel-abandon-clarity"
      aria-labelledby="shell-in-flight-cancel-abandon-clarity-heading"
    >
      <h3
        id="shell-in-flight-cancel-abandon-clarity-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
      >
        {clarity.heading}
      </h3>
      <dl className="m-0 grid gap-1.5">
        {clarity.actions.map((action) => (
          <div
            key={action.id}
            data-testid={`shell-in-flight-cancel-abandon-clarity-${action.id}`}
          >
            <dt className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {action.label}
            </dt>
            <dd className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {action.explanation}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
