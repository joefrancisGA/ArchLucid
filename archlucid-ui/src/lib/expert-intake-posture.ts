import {
  DEFAULT_WORKSPACE_MODE,
  isWorkingWorkspaceMode,
  type WorkspaceModeId,
} from "@/lib/workspace-mode/workspace-mode";
import { WORKSPACE_MODE_CHANGED_EVENT } from "@/lib/workspace-mode/workspace-mode-preference";

export const EXPERT_INTAKE_POSTURE_STORAGE_KEY = "archlucid.expert-intake-posture.v1.enabled";

export const EXPERT_INTAKE_POSTURE_CHANGED_EVENT = "archlucid.expert-intake-posture.changed";

export const EXPERT_INTAKE_POSTURE_LABEL = "Expert intake" as const;

export const EXPERT_INTAKE_POSTURE_LEAD =
  "Brief-first with a MUST checklist you control. Socratic one-at-a-time questions stay available when you need them for a requester in the room.";

/** LP-13: Working seats default to brief-first expert intake; Guided keeps wizard-first teaching. */
export function resolveDefaultExpertIntakePostureEnabled(workspaceMode: WorkspaceModeId): boolean {
  return isWorkingWorkspaceMode(workspaceMode);
}

function dispatchExpertIntakePostureChanged(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(EXPERT_INTAKE_POSTURE_CHANGED_EVENT, { detail: { enabled } }));
}

function readExplicitExpertIntakePostureOverride(): boolean | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(EXPERT_INTAKE_POSTURE_STORAGE_KEY);

    if (raw === null) {
      return null;
    }

    return raw === "1";
  }
  catch {
    return null;
  }
}

/** Principal-architect lane: minimize teaching flow, maximize checklist control. */
export function readExpertIntakePostureEnabled(
  workspaceMode: WorkspaceModeId = DEFAULT_WORKSPACE_MODE,
): boolean {
  const explicit = readExplicitExpertIntakePostureOverride();

  if (explicit !== null) {
    return explicit;
  }

  return resolveDefaultExpertIntakePostureEnabled(workspaceMode);
}

export function writeExpertIntakePostureEnabled(
  enabled: boolean,
  workspaceMode: WorkspaceModeId = DEFAULT_WORKSPACE_MODE,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (enabled === resolveDefaultExpertIntakePostureEnabled(workspaceMode)) {
      window.localStorage.removeItem(EXPERT_INTAKE_POSTURE_STORAGE_KEY);
    }
    else {
      window.localStorage.setItem(EXPERT_INTAKE_POSTURE_STORAGE_KEY, enabled ? "1" : "0");
    }

    dispatchExpertIntakePostureChanged(enabled);
  }
  catch {
    /* ignore */
  }
}

export function resetExpertIntakePostureSessionStateForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(EXPERT_INTAKE_POSTURE_STORAGE_KEY);
}

export function subscribeExpertIntakePostureChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (): void => {
    onChange();
  };

  window.addEventListener(EXPERT_INTAKE_POSTURE_CHANGED_EVENT, handler);
  window.addEventListener(WORKSPACE_MODE_CHANGED_EVENT, handler);

  return (): void => {
    window.removeEventListener(EXPERT_INTAKE_POSTURE_CHANGED_EVENT, handler);
    window.removeEventListener(WORKSPACE_MODE_CHANGED_EVENT, handler);
  };
}
