"use client";

import { useCallback, useEffect, useState } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  persistProfessionalWorkbenchEnabled,
  readProfessionalWorkbenchEnabledFromStorage,
  syncProfessionalWorkbenchFromServer,
  writeProfessionalWorkbenchEnabledToStorage,
} from "@/lib/workspace-mode/professional-workbench-preference";

/** True when Working mode split workbench (architecture + findings + evidence) should render. */
export function useProfessionalWorkbenchEnabled(): {
  readonly enabled: boolean;
  readonly mounted: boolean;
  readonly setEnabled: (enabled: boolean) => void;
} {
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();
  const [enabled, setEnabledState] = useState(() => readProfessionalWorkbenchEnabledFromStorage());
  const [preferenceMounted, setPreferenceMounted] = useState(false);

  useEffect(() => {
    setPreferenceMounted(true);

    void syncProfessionalWorkbenchFromServer().then((synced) => {
      if (synced !== null) {
        setEnabledState(synced);
      }
    });
  }, []);

  useEffect(() => {
    if (!workspaceMounted || !isWorkingMode) {
      return;
    }

    if (!preferenceMounted) {
      return;
    }

    const stored = readProfessionalWorkbenchEnabledFromStorage();

    setEnabledState(stored);
  }, [isWorkingMode, preferenceMounted, workspaceMounted]);

  const setEnabled = useCallback((next: boolean) => {
    writeProfessionalWorkbenchEnabledToStorage(next);
    setEnabledState(next);
    void persistProfessionalWorkbenchEnabled(next);
  }, []);

  const effectiveEnabled = isWorkingMode && (preferenceMounted ? enabled : readProfessionalWorkbenchEnabledFromStorage());

  return {
    enabled: effectiveEnabled,
    mounted: workspaceMounted && preferenceMounted,
    setEnabled,
  };
}
