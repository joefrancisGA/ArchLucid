import { readWorkspaceModeFromStorage } from "@/lib/workspace-mode/workspace-mode-preference";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

export const PROFESSIONAL_WORKBENCH_STORAGE_KEY = "archlucid.professional-workbench.v1.enabled";

/** Diagram panels publish node ids/labels for workbench finding ↔ diagram sync (LI-09). */
export const REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT = "archlucid:review-workbench-diagram-nodes" as const;

export type ReviewWorkbenchDiagramNodesEventDetail = {
  readonly nodes: readonly { readonly id: string; readonly label: string }[];
};

/** True when the user explicitly chose Tab-only layout (stored off or server explicit false). */
export function hasExplicitProfessionalWorkbenchTabOnlyInStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY);

    return raw === "0" || raw === "false";
  }
  catch {
    return false;
  }
}

/** Working mode defaults to the split workbench; Guided keeps tab-only layout. */
export function readProfessionalWorkbenchEnabledFromStorage(): boolean {
  if (typeof window === "undefined") {
    // RS-13: default Working to workbench before client hydration; explicit Tab-only applies after storage read.
    return true;
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

export async function syncProfessionalWorkbenchFromServer(): Promise<boolean | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getUserPreferences } = await import("@/lib/api/user-preferences");
    const remote = await getUserPreferences();

    if (remote.professionalWorkbenchEnabledIsExplicit) {
      writeProfessionalWorkbenchEnabledToStorage(remote.professionalWorkbenchEnabled);

      return remote.professionalWorkbenchEnabled;
    }

    return readProfessionalWorkbenchEnabledFromStorage();
  }
  catch {
    return null;
  }
}

export async function persistProfessionalWorkbenchToServer(enabled: boolean): Promise<boolean> {
  try {
    const { setUserProfessionalWorkbenchEnabled } = await import("@/lib/api/user-preferences");
    await setUserProfessionalWorkbenchEnabled(enabled);

    return true;
  }
  catch {
    return false;
  }
}

export async function persistProfessionalWorkbenchEnabled(enabled: boolean): Promise<boolean> {
  writeProfessionalWorkbenchEnabledToStorage(enabled);

  return persistProfessionalWorkbenchToServer(enabled);
}
