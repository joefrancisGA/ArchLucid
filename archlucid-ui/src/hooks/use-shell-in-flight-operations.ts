"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { getOperation } from "@/lib/api/operations-api";
import {
  clearInFlightOperations,
  getInFlightOperations,
  hydrateInFlightOperationsFromStorage,
  patchInFlightOperation,
  removeInFlightOperation,
  subscribeInFlightOperations,
  type TrackedInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import { resolveOperationDetailHref } from "@/lib/operations/operation-location";
import { isTerminalOperationState } from "@/lib/operations/operation-state";
import { markReviewPipelineCompletionNotified } from "@/lib/review-pipeline-completion-notify-dedupe";
import { ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator/operator-scope-storage";

export const SHELL_IN_FLIGHT_POLL_MS = 2000;
export const SHELL_IN_FLIGHT_TERMINAL_HOLD_MS = 8000;

function pathnameMatchesOperation(pathname: string, operation: TrackedInFlightOperation): boolean {
  if (pathname === operation.href || pathname.startsWith(`${operation.href}/`)) {
    return true;
  }

  if (operation.runId !== null) {
    const runSegment = `/architecture/reviews/${encodeURIComponent(operation.runId)}`;

    if (pathname === runSegment || pathname.startsWith(`${runSegment}/`)) {
      return true;
    }
  }

  return false;
}

function notifyTerminalIfElsewhere(
  pathname: string,
  operation: TrackedInFlightOperation,
): void {
  if (operation.terminalToastShown) {
    return;
  }

  if (pathnameMatchesOperation(pathname, operation)) {
    patchInFlightOperation(operation.operationId, { terminalToastShown: true });

    // Soft-refresh RSC panels (e.g. AI quality warnings) after async execute finishes on this route.
    window.dispatchEvent(
      new CustomEvent("archlucid:shell-operation-terminal", {
        detail: { operationId: operation.operationId, href: operation.href },
      }),
    );
    return;
  }

  patchInFlightOperation(operation.operationId, { terminalToastShown: true });

  if (operation.runId !== null) {
    markReviewPipelineCompletionNotified(operation.runId);
  }

  const href = operation.href;
  const description = operation.stepLabel;

  if (operation.state === "Succeeded") {
    toast.success(`${operation.title} finished`, {
      description,
      action: {
        label: "Open",
        onClick: () => {
          window.location.assign(href);
        },
      },
    });
    return;
  }

  if (operation.state === "Failed") {
    toast.error(`${operation.title} failed`, {
      description,
      action: {
        label: "Open",
        onClick: () => {
          window.location.assign(href);
        },
      },
    });
    return;
  }

  toast.message(`${operation.title} canceled`, {
    description,
    action: {
      label: "Open",
      onClick: () => {
        window.location.assign(href);
      },
    },
  });
}

/**
 * Subscribes to the in-flight registry and polls GET /v1/operations/{id} until terminal (TB-2077).
 */
export function useShellInFlightOperations(): readonly TrackedInFlightOperation[] {
  const pathname = usePathname() ?? "/";
  const operations = useSyncExternalStore(
    subscribeInFlightOperations,
    getInFlightOperations,
    getInFlightOperations,
  );
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Hydration runs in an effect (not during render) so the server and first client snapshots match.
  useEffect(() => {
    hydrateInFlightOperationsFromStorage();
  }, []);

  useEffect(() => {
    function handleScopeChanged(): void {
      clearInFlightOperations();
    }

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, handleScopeChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, handleScopeChanged);
    };
  }, []);

  const activeOperationIdsKey = useMemo(
    () =>
      operations
        .filter((row) => !isTerminalOperationState(row.state))
        .map((row) => row.operationId)
        .join("|"),
    [operations],
  );

  useEffect(() => {
    if (activeOperationIdsKey.length === 0) {
      return;
    }

    const activeIds = activeOperationIdsKey.split("|").filter((id) => id.length > 0);
    let cancelled = false;

    async function pollOnce(): Promise<void> {
      for (const operationId of activeIds) {
        if (cancelled) {
          return;
        }

        const row = getInFlightOperations().find((item) => item.operationId === operationId);

        if (row === undefined || isTerminalOperationState(row.state)) {
          continue;
        }

        try {
          const detail = await getOperation(operationId);
          const runId = detail.resultRef?.runId ?? row.runId;
          const href = resolveOperationDetailHref(row.href, runId);

          patchInFlightOperation(operationId, {
            stepLabel: detail.stepLabel,
            state: detail.state,
            runId,
            href,
          });

          if (isTerminalOperationState(detail.state)) {
            const latest =
              getInFlightOperations().find((item) => item.operationId === operationId) ?? {
                ...row,
                stepLabel: detail.stepLabel,
                state: detail.state,
                runId,
                href,
              };
            notifyTerminalIfElsewhere(pathnameRef.current, latest);

            window.setTimeout(() => {
              removeInFlightOperation(operationId);
            }, SHELL_IN_FLIGHT_TERMINAL_HOLD_MS);
          }
        } catch {
          // Keep the row; next interval retries. Avoid toast spam on transient poll failures.
        }
      }
    }

    void pollOnce();
    const timer = window.setInterval(() => {
      void pollOnce();
    }, SHELL_IN_FLIGHT_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeOperationIdsKey]);

  return operations;
}
