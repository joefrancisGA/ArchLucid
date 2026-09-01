"use client";

import { useMemo } from "react";

import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { useWorkspaceAiAvailabilityCheck } from "@/hooks/useWorkspaceAiAvailabilityCheck";
import type { WorkspaceAiAvailabilityCheckState } from "@/hooks/useWorkspaceAiAvailabilityCheck";
import { parseAgentExecutionModeWire } from "@/lib/agent-execution-mode";
import {
  isDevTestingOverridesEnabled,
  readDevAgentExecutionModeOverrideFromDocument,
} from "@/lib/dev-testing-overrides";
import {
  workspaceAiUnavailableDetail,
  type WorkspaceAiAvailabilityResult,
} from "@/lib/workspace-ai-availability";

export type SessionAiReadinessState = {
  readonly sessionMode: "Simulator" | "Real" | null;
  readonly hostMode: "Simulator" | "Real" | null;
  readonly hasDevOverride: boolean;
  readonly isSessionReal: boolean;
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly blocksExecute: boolean;
  readonly detail: string | null;
  readonly availability: WorkspaceAiAvailabilityResult | null;
  readonly probeState: WorkspaceAiAvailabilityCheckState;
  readonly checkAvailability: (options?: { readonly force?: boolean }) => Promise<void>;
};

/** Session-effective Real mode readiness from the authenticated availability probe. */
export function useSessionAiReadiness(): SessionAiReadinessState {
  const { mode: sessionMode, isSimulator, isLoading: modeLoading } = useAgentExecutionMode();
  const healthQuery = useHealthReadySummaryQuery();
  const hostMode = parseAgentExecutionModeWire(healthQuery.data?.agentExecutionMode);
  const hasDevOverride =
    isDevTestingOverridesEnabled() && readDevAgentExecutionModeOverrideFromDocument() !== null;
  const isSessionReal = !isSimulator && sessionMode === "Real";

  const { state, checkAvailability } = useWorkspaceAiAvailabilityCheck({
    enabled: isSessionReal,
    autoCheck: true,
  });

  return useMemo(() => {
    if (!isSessionReal) {
      return {
        sessionMode,
        hostMode,
        hasDevOverride,
        isSessionReal: false,
        isLoading: modeLoading,
        isReady: true,
        blocksExecute: false,
        detail: null,
        availability: null,
        probeState: { status: "idle" } as const,
        checkAvailability,
      };
    }

    if (state.status === "idle" || state.status === "loading" || modeLoading) {
      return {
        sessionMode,
        hostMode,
        hasDevOverride,
        isSessionReal: true,
        isLoading: true,
        isReady: false,
        blocksExecute: true,
        detail: "Validating live AI readiness for this session…",
        availability: null,
        probeState: state,
        checkAvailability,
      };
    }

    if (state.status === "error") {
      return {
        sessionMode,
        hostMode,
        hasDevOverride,
        isSessionReal: true,
        isLoading: false,
        isReady: false,
        blocksExecute: true,
        detail: state.message,
        availability: null,
        probeState: state,
        checkAvailability,
      };
    }

    const availability = state.result;
    const isReady = availability.isAvailable;

    return {
      sessionMode,
      hostMode,
      hasDevOverride,
      isSessionReal: true,
      isLoading: false,
      isReady,
      blocksExecute: !isReady,
      detail: isReady ? availability.summary : workspaceAiUnavailableDetail(availability),
      availability,
      probeState: state,
      checkAvailability,
    };
  }, [checkAvailability, hasDevOverride, hostMode, isSessionReal, modeLoading, sessionMode, state]);
}
