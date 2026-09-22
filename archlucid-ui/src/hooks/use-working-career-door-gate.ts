"use client";

import { useCallback, useMemo } from "react";

import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { useSessionAiReadiness } from "@/hooks/session-ai-readiness-context";
import {
  resolveWorkingCareerDoorGate,
  type ResolveWorkingCareerDoorGateInput,
  type WorkingCareerDoorGateResult,
} from "@/lib/governance/working-career-door-gate";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

function buildWorkingCareerDoorGateInput(
  selectedDoor: WorkingCareerRehearsalDoorId,
  sessionMode: ResolveWorkingCareerDoorGateInput["sessionMode"],
  readiness: ReturnType<typeof useSessionAiReadiness>,
  modeLoading: boolean,
): ResolveWorkingCareerDoorGateInput {
  return {
    selectedDoor,
    hostMode: readiness.hostMode,
    sessionMode,
    isSessionReal: readiness.isSessionReal,
    isLiveAiReady: readiness.isReady,
    isLoading: modeLoading || readiness.isLoading,
  };
}

/** Combines execution mode + live AI readiness for Working Career door gating (AS-078). */
export function useWorkingCareerDoorGate(
  selectedDoor: WorkingCareerRehearsalDoorId,
): WorkingCareerDoorGateResult {
  const { mode: sessionMode, isLoading: modeLoading } = useAgentExecutionMode();
  const readiness = useSessionAiReadiness();

  return useMemo(
    () =>
      resolveWorkingCareerDoorGate(
        buildWorkingCareerDoorGateInput(selectedDoor, sessionMode, readiness, modeLoading),
      ),
    [
      modeLoading,
      readiness.hostMode,
      readiness.isLoading,
      readiness.isReady,
      readiness.isSessionReal,
      selectedDoor,
      sessionMode,
    ],
  );
}

/** Evaluates Career door gates for arbitrary door selections (chooser click / keyboard cycle). */
export function useEvaluateWorkingCareerDoorGate(): (
  selectedDoor: WorkingCareerRehearsalDoorId,
) => WorkingCareerDoorGateResult {
  const { mode: sessionMode, isLoading: modeLoading } = useAgentExecutionMode();
  const readiness = useSessionAiReadiness();

  return useCallback(
    (selectedDoor: WorkingCareerRehearsalDoorId) =>
      resolveWorkingCareerDoorGate(
        buildWorkingCareerDoorGateInput(selectedDoor, sessionMode, readiness, modeLoading),
      ),
    [
      modeLoading,
      readiness.hostMode,
      readiness.isLoading,
      readiness.isReady,
      readiness.isSessionReal,
      sessionMode,
    ],
  );
}
