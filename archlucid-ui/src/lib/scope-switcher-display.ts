import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
  BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT,
  BUYER_SCOPE_SAMPLE_WORKSPACE_FULL_NAME,
  BUYER_WORKSPACE_SHORT_NAME,
} from "@/lib/buyer-polish-copy";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";

export type ScopeSwitcherWorkspaceOption = {
  readonly workspaceId: string;
  readonly name: string;
  readonly projects: ReadonlyArray<{ readonly projectId: string; readonly name: string }>;
};

export function isEffectiveDevDefaultScope(workspaceId: string, projectId: string): boolean {
  return (
    workspaceId.trim() === DEV_SCOPE_WORKSPACE_ID &&
    projectId.trim() === DEV_SCOPE_PROJECT_ID
  );
}

export function workspaceShortNameFromLabel(workspaceLabel: string): string {
  const trimmed = workspaceLabel.trim();

  if (trimmed.length === 0) {
    return BUYER_WORKSPACE_SHORT_NAME;
  }

  const withoutSuffix = trimmed.replace(/\s+workspace$/i, "").trim();

  return withoutSuffix.length > 0 ? withoutSuffix : BUYER_WORKSPACE_SHORT_NAME;
}

/** Full sample-workspace heading for dropdowns, tooltips, and accessible names. */
export function formatScopeSwitcherSampleFullTitle(): string {
  return `Sample workspace: ${BUYER_SCOPE_SAMPLE_WORKSPACE_FULL_NAME}`;
}

/** Visible compact label for the top-bar scope switcher button. */
export function formatScopeSwitcherTriggerLabel(args: {
  readonly workspaceLabel: string;
  readonly projectLabel: string;
  readonly isSampleWorkspaceSession: boolean;
  readonly includeProject: boolean;
}): string {
  const shortName = workspaceShortNameFromLabel(args.workspaceLabel);

  if (args.isSampleWorkspaceSession) {
    return BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL;
  }

  if (!args.includeProject) {
    return `Workspace: ${shortName}`;
  }

  return `Workspace: ${shortName} — ${args.projectLabel}`;
}

/** Screen-reader and tooltip text — includes sample metadata not shown in the compact button. */
export function formatScopeSwitcherTriggerAccessibleLabel(args: {
  readonly workspaceLabel: string;
  readonly projectLabel: string;
  readonly isSampleWorkspaceSession: boolean;
  readonly includeProject: boolean;
}): string {
  if (args.isSampleWorkspaceSession) {
    return `${formatScopeSwitcherSampleFullTitle()}. ${BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT}`;
  }

  const compactLabel = formatScopeSwitcherTriggerLabel(args);

  return `Active workspace: ${compactLabel}`;
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

/**
 * Primary clickable label for a workspace/project option.
 * Single-project workspaces lead with the workspace name (operators recognize that);
 * multi-project workspaces lead with the project name under a workspace group header.
 */
export function resolveScopeSwitcherOptionPrimaryLabel(args: {
  readonly workspaceName: string;
  readonly projectName: string;
  readonly workspaceProjectCount: number;
}): string {
  const workspaceName = args.workspaceName.trim();
  const projectName = args.projectName.trim();

  if (args.workspaceProjectCount <= 1) {
    return workspaceName.length > 0 ? workspaceName : projectName.length > 0 ? projectName : "Workspace";
  }

  return projectName.length > 0 ? projectName : "Project";
}

export function isScopeSwitcherOptionSelected(args: {
  readonly optionWorkspaceId: string;
  readonly optionProjectId: string;
  readonly activeWorkspaceId: string;
  readonly activeProjectId: string;
}): boolean {
  return (
    args.optionWorkspaceId.trim() === args.activeWorkspaceId.trim() &&
    args.optionProjectId.trim() === args.activeProjectId.trim()
  );
}
