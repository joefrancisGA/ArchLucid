"use client";

import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { useShellInFlightOperations } from "@/hooks/use-shell-in-flight-operations";
import { OPERATOR_HOME_IN_PROGRESS_HEADING } from "@/lib/buyer-copy/operator-home";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildLongOperationWaitCopy } from "@/lib/operations/long-operation-wait-copy";
import { isTerminalOperationState } from "@/lib/operations/operation-state";
import { cn } from "@/lib/utils";

/** Home + Reviews surfaces: same in-flight store as Start review and the shell popover. */
export function OperatorHomeInFlightReviewsSection(): React.JSX.Element | null {
  const operations = useShellInFlightOperations();
  const visibleOperations = operations.filter(
    (row) => !isTerminalOperationState(row.state) || row.retainUntilConsumed,
  );

  if (visibleOperations.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="operator-home-in-flight-reviews-heading"
      className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-700"
      data-testid="operator-home-in-flight-reviews"
    >
      <h2
        id="operator-home-in-flight-reviews-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionLabel)}
      >
        {OPERATOR_HOME_IN_PROGRESS_HEADING}
      </h2>

      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {visibleOperations.map((operation) => {
          const detail = buildLongOperationWaitCopy({
            operationLabel: operation.title,
            stageLabel: operation.stepLabel,
            elapsedMs: 0,
          }).detail;

          return (
            <li
              key={operation.operationId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
            >
              <div className="min-w-0 space-y-1">
                <p className={cn("m-0 truncate font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {operation.title}
                </p>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {detail}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <StatusTag tone="info" label={operation.stepLabel} />
                <Link
                  href={operation.href}
                  className="text-al-link underline-offset-2 hover:underline"
                  data-testid={`operator-home-in-flight-open-${operation.operationId}`}
                >
                  Open
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
