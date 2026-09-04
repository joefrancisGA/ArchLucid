import { useCallback, useEffect, useRef, useState } from "react";

import { logWorkspaceAiAvailabilityProbe } from "@/lib/session-ai-readiness/log-workspace-ai-availability-probe";
import {
  fetchWorkspaceAiAvailability,
  WORKSPACE_AI_AVAILABILITY_FETCH_TIMEOUT_MS,
  type WorkspaceAiAvailabilityResult,
} from "@/lib/workspace-ai-availability";

export type WorkspaceAiAvailabilityCheckState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "loaded"; readonly result: WorkspaceAiAvailabilityResult }
  | { readonly status: "error"; readonly message: string };

export type WorkspaceAiAvailabilityCheck = {
  readonly state: WorkspaceAiAvailabilityCheckState;
  readonly checkAvailability: (options?: { readonly force?: boolean }) => Promise<void>;
};

export function useWorkspaceAiAvailabilityCheck(input: {
  readonly enabled: boolean;
  readonly autoCheck?: boolean;
  readonly autoRetryOnError?: boolean;
  readonly maxAutoRetries?: number;
}): WorkspaceAiAvailabilityCheck {
  const [state, setState] = useState<WorkspaceAiAvailabilityCheckState>({ status: "idle" });
  const inFlightRef = useRef<AbortController | null>(null);
  const autoCheckedRef = useRef(false);
  const retriesRemainingRef = useRef(input.maxAutoRetries ?? (input.autoRetryOnError === true ? 1 : 0));
  const attemptIndexRef = useRef(0);

  const checkAvailability = useCallback(
    async (options?: { readonly force?: boolean }) => {
      if (!input.enabled) {
        return;
      }

      if (options?.force !== true && state.status === "loaded") {
        return;
      }

      inFlightRef.current?.abort();
      const controller = new AbortController();
      inFlightRef.current = controller;
      const startedAtMs = performance.now();
      const attemptIndex = attemptIndexRef.current;
      attemptIndexRef.current += 1;

      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, WORKSPACE_AI_AVAILABILITY_FETCH_TIMEOUT_MS);

      setState({ status: "loading" });

      try {
        const result = await fetchWorkspaceAiAvailability({ signal: controller.signal });

        if (inFlightRef.current !== controller) {
          return;
        }

        logWorkspaceAiAvailabilityProbe({
          outcome: "success",
          durationMs: Math.round(performance.now() - startedAtMs),
          isAvailable: result.isAvailable,
          aiSource: result.aiSource,
          retryAttempt: attemptIndex,
        });

        setState({ status: "loaded", result });
        attemptIndexRef.current = 0;
      } catch (error) {
        if (inFlightRef.current !== controller) {
          return;
        }

        const timedOut =
          controller.signal.aborted ||
          (error instanceof Error &&
            (error.name === "AbortError" || error.message.toLowerCase().includes("abort")));

        const durationMs = Math.round(performance.now() - startedAtMs);

        if (input.autoRetryOnError === true && retriesRemainingRef.current > 0) {
          retriesRemainingRef.current -= 1;

          logWorkspaceAiAvailabilityProbe({
            outcome: timedOut ? "timeout" : "error",
            durationMs,
            retryAttempt: attemptIndex,
          });

          window.setTimeout(() => {
            void checkAvailability({ force: true });
          }, 400);

          return;
        }

        logWorkspaceAiAvailabilityProbe({
          outcome: timedOut ? "timeout" : "error",
          durationMs,
          retryAttempt: attemptIndex,
        });

        const message = timedOut
          ? `AI availability check timed out after ${WORKSPACE_AI_AVAILABILITY_FETCH_TIMEOUT_MS / 1000}s.`
          : error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Workspace AI availability check failed.";

        setState({ status: "error", message });
        attemptIndexRef.current = 0;
      } finally {
        window.clearTimeout(timeoutId);

        if (inFlightRef.current === controller) {
          inFlightRef.current = null;
        }
      }
    },
    [input.autoRetryOnError, input.enabled, state.status],
  );

  useEffect(() => {
    if (!input.enabled) {
      autoCheckedRef.current = false;
      retriesRemainingRef.current = input.maxAutoRetries ?? (input.autoRetryOnError === true ? 1 : 0);
      attemptIndexRef.current = 0;
    }
  }, [input.autoRetryOnError, input.enabled, input.maxAutoRetries]);

  useEffect(() => {
    if (!input.enabled || input.autoCheck !== true || autoCheckedRef.current) {
      return;
    }

    autoCheckedRef.current = true;
    void checkAvailability();
  }, [checkAvailability, input.autoCheck, input.enabled]);

  useEffect(
    () => () => {
      inFlightRef.current?.abort();
    },
    [],
  );

  return { state, checkAvailability };
}
