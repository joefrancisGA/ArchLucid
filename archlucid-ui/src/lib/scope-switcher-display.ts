import { BUYER_WORKSPACE_SHORT_NAME } from "@/lib/buyer-polish-copy";

export type ScopeSwitcherWorkspaceOption = {
  readonly workspaceId: string;
  readonly name: string;
  readonly projects: ReadonlyArray<{ readonly projectId: string; readonly name: string }>;
};

export function workspaceShortNameFromLabel(workspaceLabel: string): string {
  const trimmed = workspaceLabel.trim();

  if (trimmed.length === 0) {
    return BUYER_WORKSPACE_SHORT_NAME;
  }

  const withoutSuffix = trimmed.replace(/\s+workspace$/i, "").trim();

  return withoutSuffix.length > 0 ? withoutSuffix : BUYER_WORKSPACE_SHORT_NAME;
}

export function formatScopeSwitcherTriggerLabel(args: {
  readonly workspaceLabel: string;
  readonly projectLabel: string;
  readonly isSampleWorkspaceSession: boolean;
  readonly includeProject: boolean;
}): string {
  const shortName = workspaceShortNameFromLabel(args.workspaceLabel);

  if (args.isSampleWorkspaceSession) {
    return `Sample workspace: ${shortName}`;
  }

  if (!args.includeProject) {
    return `Workspace: ${shortName}`;
  }

  return `Workspace: ${shortName} — ${args.projectLabel}`;
}

export function countSelectableScopeOptions(
  workspaces: ReadonlyArray<ScopeSwitcherWorkspaceOption> | null,
): number {
  if (workspaces === null) {
    return 0;
  }

  return workspaces.reduce((total, workspace) => total + workspace.projects.length, 0);
}

export function isScopeSwitchingAvailable(
  workspaces: ReadonlyArray<ScopeSwitcherWorkspaceOption> | null,
): boolean {
  return countSelectableScopeOptions(workspaces) > 1;
}
