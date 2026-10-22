export const WORKSPACE_MODE_IDS = ["guided", "working"] as const;

export type WorkspaceModeId = (typeof WORKSPACE_MODE_IDS)[number];

export const DEFAULT_WORKSPACE_MODE: WorkspaceModeId = "working";

export function parseWorkspaceMode(value: string | null | undefined): WorkspaceModeId {
  if (value === null || value === undefined) {
    return DEFAULT_WORKSPACE_MODE;
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed === "working") {
    return "working";
  }

  if (trimmed === "guided") {
    return "guided";
  }

  return DEFAULT_WORKSPACE_MODE;
}

export function isGuidedWorkspaceMode(mode: WorkspaceModeId): boolean {
  return mode === "guided";
}

export function isWorkingWorkspaceMode(mode: WorkspaceModeId): boolean {
  return mode === "working";
}
