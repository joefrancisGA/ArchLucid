import type { WorkspaceModeId } from "@/lib/workspace-mode/workspace-mode";
import { DEFAULT_WORKSPACE_MODE, parseWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

export const WORKSPACE_MODE_STORAGE_KEY = "archlucid.workspace-mode.v1.personal";

export const WORKSPACE_MODE_CHANGED_EVENT = "archlucid:workspace-mode-changed";

export const WORKSPACE_MODE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE =
  "Saved on this device only. Account sync failed — check connectivity and try again.";

export type WorkspaceModeGraduationOfferState = "pending" | "dismissed" | "remind-next";

export const DEFAULT_WORKSPACE_MODE_GRADUATION_OFFER: WorkspaceModeGraduationOfferState = "pending";

function dispatchWorkspaceModeChanged(): void {
  window.dispatchEvent(new CustomEvent(WORKSPACE_MODE_CHANGED_EVENT));
}

export function parseWorkspaceModeGraduationOffer(
  value: string | null | undefined,
): WorkspaceModeGraduationOfferState {
  if (value === null || value === undefined) {
    return DEFAULT_WORKSPACE_MODE_GRADUATION_OFFER;
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed === "dismissed") {
    return "dismissed";
  }

  if (trimmed === "remind-next") {
    return "remind-next";
  }

  if (trimmed === "pending") {
    return "pending";
  }

  return DEFAULT_WORKSPACE_MODE_GRADUATION_OFFER;
}

export function readWorkspaceModeFromStorage(): WorkspaceModeId {
  if (typeof window === "undefined") {
    return DEFAULT_WORKSPACE_MODE;
  }

  try {
    return parseWorkspaceMode(window.localStorage.getItem(WORKSPACE_MODE_STORAGE_KEY));
  }
  catch {
    return DEFAULT_WORKSPACE_MODE;
  }
}

export function writeWorkspaceModeToStorage(mode: WorkspaceModeId): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, mode);
  dispatchWorkspaceModeChanged();
}

export async function syncWorkspaceModeFromServer(): Promise<WorkspaceModeId | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getUserPreferences } = await import("@/lib/api/user-preferences");
    const remote = await getUserPreferences();

    writeWorkspaceModeToStorage(parseWorkspaceMode(remote.workspaceMode));

    return parseWorkspaceMode(remote.workspaceMode);
  }
  catch {
    return null;
  }
}

export async function persistWorkspaceModeToServer(mode: WorkspaceModeId): Promise<boolean> {
  try {
    const { setUserWorkspaceMode } = await import("@/lib/api/user-preferences");
    await setUserWorkspaceMode(mode);

    return true;
  }
  catch {
    return false;
  }
}

export async function persistWorkspaceMode(mode: WorkspaceModeId): Promise<boolean> {
  writeWorkspaceModeToStorage(mode);

  return persistWorkspaceModeToServer(mode);
}

export async function persistWorkspaceModeGraduationOfferToServer(
  state: WorkspaceModeGraduationOfferState,
): Promise<boolean> {
  try {
    const { setUserWorkspaceModeGraduationOffer } = await import("@/lib/api/user-preferences");
    await setUserWorkspaceModeGraduationOffer(state);

    return true;
  }
  catch {
    return false;
  }
}

export function resetWorkspaceModeSessionStateForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WORKSPACE_MODE_STORAGE_KEY);
}

export function subscribeWorkspaceModeChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (): void => {
    onChange();
  };

  window.addEventListener(WORKSPACE_MODE_CHANGED_EVENT, handler);

  return (): void => {
    window.removeEventListener(WORKSPACE_MODE_CHANGED_EVENT, handler);
  };
}
