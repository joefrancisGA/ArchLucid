"use client";

import { useMemo } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { useSessionAiReadiness } from "@/hooks/session-ai-readiness-context";
import { useWorkingCareerDoorGate } from "@/hooks/use-working-career-door-gate";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import { tryReadExplicitWorkingCareerRehearsalDoorFromStorage } from "@/lib/governance/working-career-rehearsal-door";
import {
  resolveWorkingSimulatorCloneRehearsalChrome,
  type WorkingSimulatorCloneRehearsalChrome,
} from "@/lib/governance/working-simulator-clone-rehearsal-banner";
import {
  isGuidedWorkspaceMode,
  isWorkingWorkspaceMode,
} from "@/lib/workspace-mode/workspace-mode";

/** Working Simulator-clone rehearsal chrome (CG-015). Does not persist door or workspace mode. */
export function useWorkingSimulatorCloneRehearsalBanner(): WorkingSimulatorCloneRehearsalChrome {
  const { mode, mounted: workspaceMounted } = useWorkspaceMode();
  const { mode: sessionMode } = useAgentExecutionMode();
  const readiness = useSessionAiReadiness();
  const { door, mounted: doorMounted } = useWorkingCareerRehearsalDoor();
  const careerGate = useWorkingCareerDoorGate(door);
  const careerExplicit = tryReadExplicitWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" }) === "career";

  return useMemo(
    () =>
      resolveWorkingSimulatorCloneRehearsalChrome({
        workingDesk: workspaceMounted && doorMounted && isWorkingWorkspaceMode(mode),
        guidedDesk: isGuidedWorkspaceMode(mode),
        hostMode: readiness.hostMode,
        sessionMode,
        selectedDoor: door,
        careerExplicit,
        careerGate,
      }),
    [
      careerExplicit,
      careerGate,
      door,
      doorMounted,
      mode,
      readiness.hostMode,
      sessionMode,
      workspaceMounted,
    ],
  );
}
