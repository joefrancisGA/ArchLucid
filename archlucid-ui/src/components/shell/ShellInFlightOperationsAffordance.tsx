"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useShellInFlightOperations } from "@/hooks/use-shell-in-flight-operations";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatOperationElapsed } from "@/lib/operations/format-operation-elapsed";
import { isTerminalOperationState } from "@/lib/operations/operation-state";
import { enterpriseStatusTagClass, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Operator shell header affordance for in-flight long-running operations (TB-2077).
 * Named stages + elapsed time only — no fake percentages.
 */
export function ShellInFlightOperationsAffordance(): React.JSX.Element | null {
  const router = useRouter();
  const operations = useShellInFlightOperations();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOperationTerminal(): void {
      router.refresh();
    }

    window.addEventListener("archlucid:shell-operation-terminal", onOperationTerminal);

    return () => {
      window.removeEventListener("archlucid:shell-operation-terminal", onOperationTerminal);
    };
  }, [router]);

  useEffect(() => {
    if (operations.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [operations.length]);

  if (operations.length === 0) {
    return null;
  }

  const inFlightCount = operations.filter((row) => !isTerminalOperationState(row.state)).length;
  const labelCount = inFlightCount > 0 ? inFlightCount : operations.length;
  const pillLabel =
    labelCount === 1 ? "1 in progress" : `${labelCount} in progress`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 px-2",
            enterpriseStatusTagClass("in-progress"),
          )}
          data-testid="shell-in-flight-operations-trigger"
          aria-label={`In-flight operations: ${pillLabel}`}
        >
          <span className={OPERATOR_TYPOGRAPHY.helper}>{pillLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        data-testid="shell-in-flight-operations-panel"
      >
        <div className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            In progress
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Named stages only — elapsed time is wall-clock, not percent complete.
          </p>
        </div>
        <ul className="m-0 list-none space-y-0 p-0" aria-live="polite" aria-relevant="additions text">
          {operations.map((operation) => {
            const terminal = isTerminalOperationState(operation.state);
            const elapsed = formatOperationElapsed(operation.startedAtMs, nowMs);

            return (
              <li
                key={operation.operationId}
                className="border-b border-neutral-100 px-3 py-2 last:border-b-0 dark:border-neutral-800"
                data-testid="shell-in-flight-operation-row"
                data-operation-id={operation.operationId}
                data-operation-state={operation.state}
                aria-current={terminal ? undefined : "true"}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                      {operation.title}
                    </p>
                    <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {operation.stepLabel}
                      <span className="text-al-text-secondary/80"> · {elapsed}</span>
                    </p>
                  </div>
                  <Button variant="link" className="h-auto shrink-0 p-0" asChild>
                    <Link href={operation.href} onClick={() => setOpen(false)}>
                      Open
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
