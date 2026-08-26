import type { DeletedProjectRow, WorkspaceBinRow } from "@/lib/projects-recycle-bin-payload";
import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";

export const RECYCLE_BIN_PROJECT_LAST_VIEWED_STORAGE_KEY =
  "archlucid_recycle_bin_project_continue_last_v1";

export type RecycleBinContinueLastTarget = {
  readonly projectId: string;
  readonly projectName: string;
  readonly workspaceId: string;
  readonly workspaceName: string;
};

export type RecycleBinContinueLastProjectInput = RecycleBinContinueLastTarget & {
  readonly deletedUtcIso: string;
};

function readStoredProjectId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(RECYCLE_BIN_PROJECT_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeRecycleBinProjectLastViewedId(projectId: string): void {
  const normalized = projectId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(RECYCLE_BIN_PROJECT_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

export function flattenRecycleBinProjects(
  workspaces: readonly WorkspaceBinRow[],
): readonly RecycleBinContinueLastProjectInput[] {
  return workspaces.flatMap((workspace) =>
    workspace.deletedProjects.map((project: DeletedProjectRow) => ({
      projectId: project.projectId,
      projectName: project.name,
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.name,
      deletedUtcIso: project.deletedUtcIso,
    })),
  );
}

function toTarget(project: RecycleBinContinueLastProjectInput): RecycleBinContinueLastTarget {
  return {
    projectId: project.projectId,
    projectName: project.projectName.trim().length > 0 ? project.projectName : project.projectId,
    workspaceId: project.workspaceId,
    workspaceName: project.workspaceName,
  };
}

/** Resolves the deleted project to pin as Continue last viewed. */
export function resolveContinueLastRecycleBinProject(
  projects: unknown,
): RecycleBinContinueLastTarget | null {
  const normalizedProjects = asNonemptyReadonlyArray<RecycleBinContinueLastProjectInput>(projects);

  if (normalizedProjects === null) {
    return null;
  }

  const storedId = readStoredProjectId();

  if (storedId !== null) {
    const storedMatch = normalizedProjects.find((project) => project.projectId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const newest = normalizedProjects.slice().sort((left, right) => right.deletedUtcIso.localeCompare(left.deletedUtcIso))[0];

  return newest === undefined ? null : toTarget(newest);
}
