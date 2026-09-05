"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

import { ShellInFlightCancelAbandonClarity } from "@/components/shell/ShellInFlightCancelAbandonClarity";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { useShellInFlightOperations } from "@/hooks/use-shell-in-flight-operations";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cancelOperation } from "@/lib/api/operations-api";
import { buildCancelAbandonInFlightClarity } from "@/lib/operations/cancel-abandon-in-flight-clarity";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";
import { formatOperationElapsed } from "@/lib/operations/format-operation-elapsed";
import { patchInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { ARCHLUCID_OPEN_SHELL_IN_FLIGHT_EVENT } from "@/lib/operations/open-shell-in-flight-event";
import { isTerminalOperationState } from "@/lib/operations/operation-state";
import {
  parseShellInFlightCancelIdFromSearch,
  shellInFlightCancelConfirmHrefFromSearch,
} from "@/lib/operator/shell-in-flight-cancel-confirm-url";
import { enterpriseStatusTagClass, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Operator shell header affordance for in-flight long-running operations (TB-2077 / TB-2225).
 * Named stages + elapsed time only — no fake percentages. Wait / leave / stop are explicit.
 */
export function ShellInFlightOperationsAffordance(): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const inFlightCancelIdParam = searchParams.get("inFlightCancelId");
  const operations = useShellInFlightOperations();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const [cancellingIds, setCancellingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [pendingCancelOperationId, setPendingCancelOperationIdState] = useState<string | null>(() => {
    const parsed = parseShellInFlightCancelIdFromSearch(inFlightCancelIdParam);

    return parsed.length > 0 ? parsed : null;
  });
  const [cancelFailureMessage, setCancelFailureMessage] = useState<string | null>(null);
  const clarity = buildCancelAbandonInFlightClarity();

  const syncInFlightCancelIdToUrl = useCallback(
    (operationId: string | null) => {
      router.replace(
        shellInFlightCancelConfirmHrefFromSearch(searchParams.toString(), operationId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingCancelOperationId = useCallback(
    (value: SetStateAction<string | null>) => {
      setPendingCancelOperationIdState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncInFlightCancelIdToUrl(next);

        return next;
      });
    },
    [syncInFlightCancelIdToUrl],
  );

  useEffect(() => {
    function onOperationTerminal(): void {
      router.refresh();
    }

    function onOpenRequested(): void {
      setOpen(true);
    }

    window.addEventListener("archlucid:shell-operation-terminal", onOperationTerminal);
    window.addEventListener(ARCHLUCID_OPEN_SHELL_IN_FLIGHT_EVENT, onOpenRequested);

    return () => {
      window.removeEventListener("archlucid:shell-operation-terminal", onOperationTerminal);
      window.removeEventListener(ARCHLUCID_OPEN_SHELL_IN_FLIGHT_EVENT, onOpenRequested);
    };
  }, [router]);

  const inFlightCount = operations.filter((row) => !isTerminalOperationState(row.state)).length;

  useEffect(() => {
    if (inFlightCount === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [inFlightCount]);

  if (operations.length === 0 || inFlightCount === 0) {
    return null;
  }

  const pillLabel =
    inFlightCount === 1 ? "1 in progress" : `${inFlightCount} in progress`;

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
      setCancelFailureMessage(detail);
      setOpen(true);
    } finally {
      setCancellingIds((previous) => {
        const next = new Set(previous);
        next.delete(trimmed);
        return next;
      });
    }
  }

  const pendingCancelOperation = operations.find(
    (operation) => operation.operationId === pendingCancelOperationId,
  );

  return (
    <>
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
                          setCancelFailureMessage(null);
                          setPendingCancelOperationId(operation.operationId);
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
        {cancelFailureMessage !== null ? (
          <div className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-700">
            <OperatorErrorRecoveryContract
              testId="shell-in-flight-cancel-failure-recovery"
              presentation={errorRecoveryContractForScenario("in-flight-cancel-failure", {
                failureSummary: "Could not cancel this in-flight operation.",
              })}
            />
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
    <ConfirmationDialog
      open={pendingCancelOperationId !== null}
      onOpenChange={(dialogOpen) => {
        if (!dialogOpen) {
          setPendingCancelOperationId(null);
        }
      }}
      title="Stop this in-flight operation?"
      description={
        pendingCancelOperation !== undefined
          ? `${clarity.panelHeaderOneLiner} Stopping "${pendingCancelOperation.title}" is cooperative — work already completed stays intact.`
          : clarity.panelHeaderOneLiner
      }
      confirmLabel="Stop operation"
      variant="destructive"
      busy={
        pendingCancelOperationId !== null && cancellingIds.has(pendingCancelOperationId)
      }
      onConfirm={() => {
        if (pendingCancelOperationId === null) {
          return;
        }

        const operationId = pendingCancelOperationId;
        setPendingCancelOperationId(null);
        void handleCancel(operationId);
      }}
    />
    </>
  );
}
