"use client";

import { useEffect } from "react";

import { useIsSampleWorkspaceSession } from "@/hooks/use-effective-operator-scope";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

/** Sample workspace sessions stay on Practice (Rehearsal) until the operator returns to their workspace. */
export function OperatorSampleWorkspaceDoorPinHost(): null {
  const isSampleWorkspace = useIsSampleWorkspaceSession();
  const { mode, mounted: workspaceMounted } = useWorkspaceMode();
  const { door, mounted: doorMounted, setDoor } = useWorkingCareerRehearsalDoor();

  useEffect(() => {
    if (!workspaceMounted || !doorMounted || !isWorkingWorkspaceMode(mode)) {
      return;
    }

    if (!isSampleWorkspace) {
      return;
    }

    if (door !== "rehearsal") {
      setDoor("rehearsal");
    }
  }, [door, doorMounted, isSampleWorkspace, mode, setDoor, workspaceMounted]);

  return null;
}
