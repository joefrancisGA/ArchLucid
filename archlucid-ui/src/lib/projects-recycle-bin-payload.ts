export const DEFAULT_RECYCLE_BIN_RETENTION_DAYS = 30;

export type DeletedProjectRow = Readonly<{
  projectId: string;
  name: string;
  deletedUtcIso: string;
  purgeAfterUtcIso: string;
}>;

export type WorkspaceBinRow = Readonly<{
  workspaceId: string;
  name: string;
  deletedProjects: ReadonlyArray<DeletedProjectRow>;
}>;

export type RecycleBinPayload = Readonly<{
  retentionDays?: number;
  workspaces?: ReadonlyArray<WorkspaceBinRow | null | undefined>;
}>;

export type ParsedRecycleBinPayload = Readonly<{
  retentionDays: number | null;
  workspaces: WorkspaceBinRow[];
}>;

export function recycleBinPageDescription(retentionDays: number | null): string {
  if (retentionDays === null) {
    return "Deleted projects are kept here for the tenant retention window after deletion. You can restore a project if its name is not already used by an active project.";
  }

  return `Deleted projects are kept here for ${retentionDays} days after deletion. You can restore a project if its name is not already used by an active project.`;
}

export function recycleBinEmptyStateBody(retentionDays: number | null): string {
  if (retentionDays === null) {
    return "No soft-deleted projects are in the retention window.";
  }

  return `No soft-deleted projects are in the ${retentionDays}-day retention window.`;
}

export function recycleBinEmptyStateRetentionHint(retentionDays: number | null): string {
  if (retentionDays === null) {
    return "and it appears here for the tenant retention window before permanent removal.";
  }

  return `and it appears here for ${retentionDays} days before permanent removal.`;
}

export function computePurgeAfterUtcIso(deletedUtcIso: string, retentionDays: number): string {
  const deletedMs = Date.parse(deletedUtcIso);

  if (!Number.isFinite(deletedMs)) {
    return "";
  }

  const days = Number.isFinite(retentionDays) && retentionDays > 0 ? Math.trunc(retentionDays) : DEFAULT_RECYCLE_BIN_RETENTION_DAYS;

  return new Date(deletedMs + days * 24 * 60 * 60 * 1000).toISOString();
}

export function coerceRecycleBinPayload(json: unknown): ParsedRecycleBinPayload {
  if (json === null || typeof json !== "object") {
    return { retentionDays: null, workspaces: [] };
  }

  const payload = json as RecycleBinPayload;
  const retentionDays =
    typeof payload.retentionDays === "number" && Number.isFinite(payload.retentionDays) && payload.retentionDays > 0
      ? Math.trunc(payload.retentionDays)
      : null;

  const workspaces = payload.workspaces;
  if (!Array.isArray(workspaces)) {
    return { retentionDays, workspaces: [] };
  }

  const out: WorkspaceBinRow[] = [];

  for (const w of workspaces) {
    if (w === null || typeof w !== "object") {
      continue;
    }

    const ws = w as {
      workspaceId?: string;
      id?: string;
      name?: string;
      displayName?: string;
      deletedProjects?: ReadonlyArray<{
        projectId?: string;
        id?: string;
        name?: string;
        displayName?: string;
        deletedUtc?: string;
        purgeAfterUtc?: string;
      }>;
    };

    const wid = typeof ws.workspaceId === "string" ? ws.workspaceId : typeof ws.id === "string" ? ws.id : "";
    const wnameRaw =
      typeof ws.displayName === "string" && ws.displayName.trim().length > 0
        ? ws.displayName.trim()
        : typeof ws.name === "string" && ws.name.trim().length > 0
          ? ws.name.trim()
          : "Workspace";

    if (!wid.trim()) {
      continue;
    }

    const dps = ws.deletedProjects;
    if (!Array.isArray(dps)) {
      continue;
    }

    const projects: DeletedProjectRow[] = [];

    for (const p of dps) {
      if (p === null || typeof p !== "object") {
        continue;
      }

      const pid =
        typeof p.projectId === "string" ? p.projectId : typeof p.id === "string" ? p.id : "";
      const pnameRaw =
        typeof p.displayName === "string" && p.displayName.trim().length > 0
          ? p.displayName.trim()
          : typeof p.name === "string" && p.name.trim().length > 0
            ? p.name.trim()
            : "Project";
      const deletedIso = typeof p.deletedUtc === "string" ? p.deletedUtc.trim() : "";
      const purgeIsoRaw = typeof p.purgeAfterUtc === "string" ? p.purgeAfterUtc.trim() : "";
      const purgeIso =
        purgeIsoRaw.length > 0
          ? purgeIsoRaw
          : retentionDays === null
            ? ""
            : computePurgeAfterUtcIso(deletedIso, retentionDays);

      if (!pid.trim() || !deletedIso || !purgeIso) {
        continue;
      }

      projects.push({
        projectId: pid.trim(),
        name: pnameRaw,
        deletedUtcIso: deletedIso,
        purgeAfterUtcIso: purgeIso,
      });
    }

    if (projects.length > 0) {
      out.push({ workspaceId: wid.trim(), name: wnameRaw, deletedProjects: projects });
    }
  }

  return { retentionDays, workspaces: out };
}
