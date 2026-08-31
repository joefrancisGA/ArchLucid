import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchWorkspaceAiAvailability,
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

      setState({ status: "loading" });

      try {
        const result = await fetchWorkspaceAiAvailability({ signal: controller.signal });

        if (controller.signal.aborted) {
          return;
        }

        setState({ status: "loaded", result });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Workspace AI availability check failed.";

        setState({ status: "error", message });
      }
    },
    [input.enabled, state.status],
  );

  useEffect(() => {
    if (!input.enabled || input.autoCheck === false || autoCheckedRef.current) {
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
