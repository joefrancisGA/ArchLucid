"use client";

import { useWorkspaceModeOrDefault } from "@/components/WorkspaceModeProvider";
import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { useSessionAiReadiness } from "@/hooks/session-ai-readiness-context";
import { useWorkingCareerDoorGate } from "@/hooks/use-working-career-door-gate";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import {
  tryReadExplicitWorkingCareerRehearsalDoorFromStorage,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";
import { resolveWorkingSimulatorCloneRehearsalChrome } from "@/lib/governance/working-simulator-clone-rehearsal-banner";
import {
  isGuidedWorkspaceMode,
  isWorkingWorkspaceMode,
} from "@/lib/workspace-mode/workspace-mode";

export type UseEffectiveWorkingCareerRehearsalDoorResult = {
  readonly door: WorkingCareerRehearsalDoorId;
  readonly effectiveDoor: WorkingCareerRehearsalDoorId;
  readonly mounted: boolean;
};

/** Selected Working door plus AS-078 / CG-015 Simulator-clone rehearsal overlay for execute chrome. */
export function useEffectiveWorkingCareerRehearsalDoor(): UseEffectiveWorkingCareerRehearsalDoorResult {
  const { door, mounted } = useWorkingCareerRehearsalDoor();
  const gate = useWorkingCareerDoorGate(door);
  const workspaceMode = useWorkspaceModeOrDefault();
  const { mode: sessionMode } = useAgentExecutionMode();
  const readiness = useSessionAiReadiness();
  const careerExplicit = tryReadExplicitWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" }) === "career";
  const chrome = resolveWorkingSimulatorCloneRehearsalChrome({
    workingDesk: isWorkingWorkspaceMode(workspaceMode),
    guidedDesk: isGuidedWorkspaceMode(workspaceMode),
    hostMode: readiness.hostMode,
    sessionMode,
    selectedDoor: door,
    careerExplicit,
    careerGate: gate,
  });

  return {
    door,
    effectiveDoor: chrome.effectiveDoor,
    mounted,
  };
}
