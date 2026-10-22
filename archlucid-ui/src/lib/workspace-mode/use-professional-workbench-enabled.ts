"use client";

import { useCallback, useEffect, useState } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { readWorkspaceModeFromStorage } from "@/lib/workspace-mode/workspace-mode-preference";
import {
  persistProfessionalWorkbenchEnabled,
  readProfessionalWorkbenchEnabledFromStorage,
  syncProfessionalWorkbenchFromServer,
  writeProfessionalWorkbenchEnabledToStorage,
} from "@/lib/workspace-mode/professional-workbench-preference";

function resolveWorkingModeForWorkbench(
  workspaceMounted: boolean,
  isWorkingMode: boolean,
): boolean {
  if (workspaceMounted) {
    return isWorkingMode;
  }

  return isWorkingWorkspaceMode(readWorkspaceModeFromStorage());
}

/** True when Working mode split workbench (architecture + findings + evidence) should render. */
export function useProfessionalWorkbenchEnabled(): {
  readonly enabled: boolean;
  readonly mounted: boolean;
  readonly setEnabled: (enabled: boolean) => void;
} {
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();
  const [enabled, setEnabledState] = useState(() => readProfessionalWorkbenchEnabledFromStorage());

  useEffect(() => {
    void syncProfessionalWorkbenchFromServer().then((synced) => {
      if (synced !== null) {
        setEnabledState(synced);
      }
    });
  }, []);

  useEffect(() => {
    if (!workspaceMounted) {
      return;
    }

    setEnabledState(readProfessionalWorkbenchEnabledFromStorage());
  }, [isWorkingMode, workspaceMounted]);

  const setEnabled = useCallback((next: boolean) => {
    writeProfessionalWorkbenchEnabledToStorage(next);
    setEnabledState(next);
    void persistProfessionalWorkbenchEnabled(next);
  }, []);

  const workingMode = resolveWorkingModeForWorkbench(workspaceMounted, isWorkingMode);

  return {
    enabled: workingMode && enabled,
    mounted: true,
    setEnabled,
  };
}
