"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ShellInFlightCancelAbandonClarity } from "@/components/shell/ShellInFlightCancelAbandonClarity";
import { useShellInFlightOperations } from "@/hooks/use-shell-in-flight-operations";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cancelOperation } from "@/lib/api/operations-api";
import { buildCancelAbandonInFlightClarity } from "@/lib/operations/cancel-abandon-in-flight-clarity";
import { formatOperationElapsed } from "@/lib/operations/format-operation-elapsed";
import { patchInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { isTerminalOperationState } from "@/lib/operations/operation-state";
import { enterpriseStatusTagClass, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Operator shell header affordance for in-flight long-running operations (TB-2077 / TB-2225).
 * Named stages + elapsed time only — no fake percentages. Wait / leave / stop are explicit.
 */
export function ShellInFlightOperationsAffordance(): React.JSX.Element | null {
  const router = useRouter();
  const operations = useShellInFlightOperations();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const [cancellingIds, setCancellingIds] = useState<ReadonlySet<string>>(() => new Set());
  const clarity = buildCancelAbandonInFlightClarity();

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

  async function handleCancel(operationId: string): Promise<void> {
    const trimmed = operationId.trim();

    if (trimmed.length === 0 || cancellingIds.has(trimmed)) {
      return;
    }

    setCancellingIds((previous) => new Set([...previous, trimmed]));

    try {
      await cancelOperation(trimmed);
      patchInFlightOperation(trimmed, {
        state: "CancelRequested",
        stepLabel: "Cancel requested",
      });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "Try again in a moment.";
      showError("Could not cancel this work", detail);
    } finally {
      setCancellingIds((previous) => {
        const next = new Set(previous);
        next.delete(trimmed);
        return next;
      });
    }
  }

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
            {clarity.panelHeaderOneLiner}
          </p>
        </div>
        <ShellInFlightCancelAbandonClarity />
        <ul className="m-0 list-none space-y-0 p-0" aria-live="polite" aria-relevant="additions text">
          {operations.map((operation) => {
            const terminal = isTerminalOperationState(operation.state);
            const elapsed = formatOperationElapsed(operation.startedAtMs, nowMs);
            const cancelInFlight = cancellingIds.has(operation.operationId);
            const cancelAlreadyRequested = operation.state === "CancelRequested";
            const showCancel = !terminal;

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
                  <div className="flex shrink-0 flex-col items-stretch gap-1">
                    {showCancel ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                        disabled={cancelInFlight || cancelAlreadyRequested}
                        data-testid="shell-in-flight-operation-cancel"
                        aria-label={`Cancel ${operation.title}`}
                        onClick={() => {
                          void handleCancel(operation.operationId);
                        }}
                      >
                        {cancelInFlight || cancelAlreadyRequested ? "Canceling…" : "Cancel"}
                      </Button>
                    ) : null}
                    <Button variant="outline" className="h-auto shrink-0 p-0" asChild>
                      <Link href={operation.href} onClick={() => setOpen(false)}>
                        Open
                      </Link>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
