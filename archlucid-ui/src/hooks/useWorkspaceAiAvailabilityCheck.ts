import { useCallback, useEffect, useRef, useState } from "react";

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
}): WorkspaceAiAvailabilityCheck {
  const [state, setState] = useState<WorkspaceAiAvailabilityCheckState>({ status: "idle" });
  const inFlightRef = useRef<AbortController | null>(null);
  const autoCheckedRef = useRef(false);

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

      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, WORKSPACE_AI_AVAILABILITY_FETCH_TIMEOUT_MS);

      setState({ status: "loading" });

      try {
        const result = await fetchWorkspaceAiAvailability({ signal: controller.signal });

        if (inFlightRef.current !== controller) {
          return;
        }

        setState({ status: "loaded", result });
      } catch (error) {
        if (inFlightRef.current !== controller) {
          return;
        }

        const timedOut =
          controller.signal.aborted ||
          (error instanceof Error &&
            (error.name === "AbortError" || error.message.toLowerCase().includes("abort")));

        const message = timedOut
          ? `AI availability check timed out after ${WORKSPACE_AI_AVAILABILITY_FETCH_TIMEOUT_MS / 1000}s. Press Check AI availability to retry.`
          : error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Workspace AI availability check failed.";

        setState({ status: "error", message });
      } finally {
        window.clearTimeout(timeoutId);

        if (inFlightRef.current === controller) {
          inFlightRef.current = null;
        }
      }
    },
    [input.enabled, state.status],
  );

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
