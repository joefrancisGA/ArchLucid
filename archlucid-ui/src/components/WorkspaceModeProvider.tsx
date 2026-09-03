"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_WORKSPACE_MODE,
  type WorkspaceModeId,
  isWorkingWorkspaceMode,
} from "@/lib/workspace-mode/workspace-mode";
import {
  persistWorkspaceMode,
  readWorkspaceModeFromStorage,
  syncWorkspaceModeFromServer,
} from "@/lib/workspace-mode/workspace-mode-preference";
import { writeProfessionalWorkbenchEnabledToStorage } from "@/lib/workspace-mode/professional-workbench-preference";

export type WorkspaceModeAccountSyncState = "idle" | "synced" | "local-only";

type WorkspaceModeContextValue = {
  readonly mode: WorkspaceModeId;
  readonly mounted: boolean;
  readonly accountSyncState: WorkspaceModeAccountSyncState;
  readonly isWorkingMode: boolean;
  readonly setAndPersist: (mode: WorkspaceModeId) => void;
};

const WorkspaceModeContext = createContext<WorkspaceModeContextValue | null>(null);

export { WorkspaceModeContext };

/** Single source of truth for Guided vs Working workspace mode. */
export function WorkspaceModeProvider(props: { readonly children: ReactNode }) {
  const [mode, setMode] = useState<WorkspaceModeId>(DEFAULT_WORKSPACE_MODE);
  const [mounted, setMounted] = useState(false);
  const [accountSyncState, setAccountSyncState] = useState<WorkspaceModeAccountSyncState>("idle");

  useEffect(() => {
    setMode(readWorkspaceModeFromStorage());
    setMounted(true);

    void syncWorkspaceModeFromServer().then((syncedMode) => {
      if (syncedMode === null) {
        return;
      }

      setMode(syncedMode);
      setAccountSyncState("synced");
    });
  }, []);

  const setAndPersist = useCallback((nextMode: WorkspaceModeId) => {
    setMode(nextMode);

    if (isWorkingWorkspaceMode(nextMode)) {
      writeProfessionalWorkbenchEnabledToStorage(true);
    }

    void persistWorkspaceMode(nextMode).then((synced) => {
      setAccountSyncState(synced ? "synced" : "local-only");
    });
  }, []);

  const value = useMemo<WorkspaceModeContextValue>(
    () => ({
      mode,
      mounted,
      accountSyncState,
      isWorkingMode: isWorkingWorkspaceMode(mode),
      setAndPersist,
    }),
    [accountSyncState, mode, mounted, setAndPersist],
  );

  return (
    <WorkspaceModeContext.Provider value={value}>
      {props.children}
    </WorkspaceModeContext.Provider>
  );
}

export function useWorkspaceMode(): WorkspaceModeContextValue {
  const context = useContext(WorkspaceModeContext);

  if (context === null) {
    throw new Error("useWorkspaceMode must be used within WorkspaceModeProvider.");
  }

  return context;
}

/** When no provider is mounted (tests, marketing), default to Guided. */
export function useWorkspaceModeOrDefault(): WorkspaceModeId {
  const context = useContext(WorkspaceModeContext);

  if (context === null) {
    return DEFAULT_WORKSPACE_MODE;
  }

  return context.mode;
}
