"use client";

import { useCallback, useEffect, useState } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  readProfessionalWorkbenchEnabledFromStorage,
  writeProfessionalWorkbenchEnabledToStorage,
} from "@/lib/workspace-mode/professional-workbench-preference";

/** True when Working mode split workbench (architecture + findings + evidence) should render. */
export function useProfessionalWorkbenchEnabled(): {
  readonly enabled: boolean;
  readonly mounted: boolean;
  readonly setEnabled: (enabled: boolean) => void;
} {
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();
  const [enabled, setEnabledState] = useState(false);
  const [preferenceMounted, setPreferenceMounted] = useState(false);

  useEffect(() => {
    setEnabledState(readProfessionalWorkbenchEnabledFromStorage());
    setPreferenceMounted(true);
  }, []);

  useEffect(() => {
    if (!workspaceMounted || !isWorkingMode) {
      return;
    }

    if (!preferenceMounted) {
      return;
    }

    const stored = readProfessionalWorkbenchEnabledFromStorage();

    if (stored) {
      setEnabledState(true);
    }
  }, [isWorkingMode, preferenceMounted, workspaceMounted]);

  const setEnabled = useCallback((next: boolean) => {
    writeProfessionalWorkbenchEnabledToStorage(next);
    setEnabledState(next);
  }, []);

  return {
    enabled: isWorkingMode && enabled,
    mounted: workspaceMounted && preferenceMounted,
    setEnabled,
  };
}
