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
import { isLiveAiProbeReady } from "@/lib/session-ai-readiness/is-live-ai-probe-ready";
import {
  workspaceAiUnavailableDetail,
  type WorkspaceAiAvailabilityResult,
} from "@/lib/workspace-ai-availability";

export type SessionAiReadinessOptions = {
  /** When true (failed review with AI recovery), auto-run the live probe on page load even in Simulator mode. */
  readonly requireLiveProbe?: boolean;
};

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

const WAITING_FOR_API_READINESS_DETAIL =
  "Waiting for API readiness before checking live AI for this session…";

/** Core session readiness hook — use {@link useSessionAiReadiness} or shell provider instead of calling directly. */
export function useSessionAiReadinessCore(
  options?: SessionAiReadinessOptions,
): SessionAiReadinessState {
  const requireLiveProbe = options?.requireLiveProbe === true;
  const { mode: sessionMode, isSimulator, isLoading: modeLoading } = useAgentExecutionMode();
  const healthQuery = useHealthReadySummaryQuery();
  const hostMode = parseAgentExecutionModeWire(healthQuery.data?.agentExecutionMode);
  const hasDevOverride =
    isDevTestingOverridesEnabled() && readDevAgentExecutionModeOverrideFromDocument() !== null;
  const isSessionReal = !isSimulator && sessionMode === "Real";
  const shouldProbe = isSessionReal || requireLiveProbe;
  const healthSummaryReady = healthQuery.isSuccess;
  const probeMayRun = shouldProbe && healthSummaryReady;

  const { state, checkAvailability } = useWorkspaceAiAvailabilityCheck({
    enabled: probeMayRun,
    autoCheck: probeMayRun,
    autoRetryOnError: shouldProbe,
    maxAutoRetries: shouldProbe ? 1 : 0,
  });

  return useMemo(() => {
    if (!shouldProbe) {
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

    if (!healthSummaryReady) {
      return {
        sessionMode,
        hostMode,
        hasDevOverride,
        isSessionReal,
        isLoading: true,
        isReady: false,
        blocksExecute: isSessionReal,
        detail: WAITING_FOR_API_READINESS_DETAIL,
        availability: null,
        probeState: { status: "idle" } as const,
        checkAvailability,
      };
    }

    if (!isSessionReal) {
      if (state.status === "idle" || state.status === "loading" || modeLoading) {
        return {
          sessionMode,
          hostMode,
          hasDevOverride,
          isSessionReal: false,
          isLoading: state.status === "loading" || modeLoading,
          isReady: false,
          blocksExecute: false,
          detail: "Checking live AI availability automatically for this session…",
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
          isSessionReal: false,
          isLoading: false,
          isReady: false,
          blocksExecute: false,
          detail: state.message,
          availability: null,
          probeState: state,
          checkAvailability,
        };
      }

      const availability = state.result;
      const isReady = isLiveAiProbeReady(false, availability);

      return {
        sessionMode,
        hostMode,
        hasDevOverride,
        isSessionReal: false,
        isLoading: false,
        isReady,
        blocksExecute: false,
        detail: isReady ? availability.summary : workspaceAiUnavailableDetail(availability),
        availability,
        probeState: state,
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
    const isReady = isLiveAiProbeReady(true, availability);

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
  }, [
    checkAvailability,
    hasDevOverride,
    healthSummaryReady,
    hostMode,
    isSessionReal,
    modeLoading,
    sessionMode,
    shouldProbe,
    state,
  ]);
}
