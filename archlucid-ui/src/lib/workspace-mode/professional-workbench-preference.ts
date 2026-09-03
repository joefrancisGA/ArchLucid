import { readWorkspaceModeFromStorage } from "@/lib/workspace-mode/workspace-mode-preference";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

export const PROFESSIONAL_WORKBENCH_STORAGE_KEY = "archlucid.professional-workbench.v1.enabled";

/** Working mode defaults to the split workbench; Guided keeps tab-only layout. */
export function readProfessionalWorkbenchEnabledFromStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY);

    if (raw === "0" || raw === "false") {
      return false;
    }

    if (raw === "1" || raw === "true") {
      return true;
    }
  }
  catch {
    /* ignore */
  }

  return isWorkingWorkspaceMode(readWorkspaceModeFromStorage());
}

export function writeProfessionalWorkbenchEnabledToStorage(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY, enabled ? "1" : "0");
  }
  catch {
    /* ignore */
  }
}
