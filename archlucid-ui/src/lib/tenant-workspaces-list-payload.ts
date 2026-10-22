import { DEFAULT_RECYCLE_BIN_RETENTION_DAYS } from "@/lib/projects-recycle-bin-payload";

export type TenantWorkspaceProjectRow = Readonly<{
  projectId: string;
  name: string;
}>;

export type TenantWorkspaceListRow = Readonly<{
  workspaceId: string;
  name: string;
  defaultProjectId: string | null;
  projects: ReadonlyArray<TenantWorkspaceProjectRow>;
}>;

export type TenantWorkspacesListPayload = Readonly<{
  retentionDays: number;
  workspaces: ReadonlyArray<TenantWorkspaceListRow>;
}>;

type WorkspacesListJson = {
  retentionDays?: number;
  workspaces?: ReadonlyArray<{
    workspaceId?: string;
    id?: string;
    name?: string;
    displayName?: string;
    defaultProjectId?: string;
    projects?: ReadonlyArray<{
      projectId?: string;
      id?: string;
      name?: string;
      displayName?: string;
    }>;
  }>;
};

function parseRetentionDays(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

export function parseTenantWorkspacesListPayload(json: unknown): TenantWorkspacesListPayload {
  if (json === null || typeof json !== "object") {
    return { retentionDays: DEFAULT_RECYCLE_BIN_RETENTION_DAYS, workspaces: [] };
  }

  const root = json as WorkspacesListJson;
  const raw = root.workspaces;
  const retentionDays = parseRetentionDays(root.retentionDays) ?? DEFAULT_RECYCLE_BIN_RETENTION_DAYS;

  if (!Array.isArray(raw)) {
    return { retentionDays, workspaces: [] };
  }

  const workspaces: TenantWorkspaceListRow[] = [];

  for (const workspace of raw) {
    if (workspace === null || typeof workspace !== "object") {
      continue;
    }

    const workspaceId =
      typeof workspace.workspaceId === "string" && workspace.workspaceId.trim().length > 0
        ? workspace.workspaceId.trim()
        : typeof workspace.id === "string" && workspace.id.trim().length > 0
          ? workspace.id.trim()
          : null;

    if (workspaceId === null) {
      continue;
    }

    const name =
      typeof workspace.displayName === "string" && workspace.displayName.trim().length > 0
        ? workspace.displayName.trim()
        : typeof workspace.name === "string" && workspace.name.trim().length > 0
          ? workspace.name.trim()
          : "Workspace";

    const defaultProjectId =
      typeof workspace.defaultProjectId === "string" && workspace.defaultProjectId.trim().length > 0
        ? workspace.defaultProjectId.trim()
        : null;

    const projects: TenantWorkspaceProjectRow[] = [];
    const projectRows = workspace.projects;

    if (Array.isArray(projectRows)) {
      for (const project of projectRows) {
        if (project === null || typeof project !== "object") {
          continue;
        }

        const projectId =
          typeof project.projectId === "string" && project.projectId.trim().length > 0
            ? project.projectId.trim()
            : typeof project.id === "string" && project.id.trim().length > 0
              ? project.id.trim()
              : null;

        if (projectId === null) {
          continue;
        }

        const projectName =
          typeof project.displayName === "string" && project.displayName.trim().length > 0
            ? project.displayName.trim()
            : typeof project.name === "string" && project.name.trim().length > 0
              ? project.name.trim()
              : "Project";

        projects.push({ projectId, name: projectName });
      }
    }

    workspaces.push({ workspaceId, name, defaultProjectId, projects });
  }

  return { retentionDays, workspaces };
}

export function findTenantWorkspaceRow(
  payload: TenantWorkspacesListPayload,
  workspaceId: string,
): TenantWorkspaceListRow | null {
  const trimmed = workspaceId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return payload.workspaces.find((workspace) => workspace.workspaceId === trimmed) ?? null;
}

export function isWorkspaceDefaultProject(
  workspace: TenantWorkspaceListRow,
  projectId: string,
): boolean {
  if (workspace.defaultProjectId === null) {
    return false;
  }

  return workspace.defaultProjectId === projectId.trim();
}
