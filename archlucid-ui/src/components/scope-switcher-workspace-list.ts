import { BUYER_WORKSPACE_DISPLAY_NAME } from "@/lib/buyer/buyer-polish-copy";
import { isEffectiveDevDefaultScope, type ScopeSwitcherWorkspaceOption } from "@/lib/scope-switcher-display";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { ApiV1Routes } from "@/lib/api-v1-routes";

export const WORKSPACES_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspaces}`;

type WorkspacesListPayload = {
  workspaces?: ReadonlyArray<{
    workspaceId?: string;
    id?: string;
    name?: string;
    displayName?: string;
    projects?: ReadonlyArray<{
      projectId?: string;
      id?: string;
      name?: string;
      displayName?: string;
    }>;
  }>;
};

export function parseWorkspacesList(json: unknown): ScopeSwitcherWorkspaceOption[] {
  if (json === null || typeof json !== "object") {
    return [];
  }
  const root = json as WorkspacesListPayload;
  const raw = root.workspaces;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: ScopeSwitcherWorkspaceOption[] = [];
  for (const w of raw) {
    if (w === null || typeof w !== "object") {
      continue;
    }
    const wid = (w as { workspaceId?: string; id?: string }).workspaceId ?? (w as { id?: string }).id;
    if (typeof wid !== "string" || wid.trim().length === 0) {
      continue;
    }
    const wname =
      typeof w.displayName === "string" && w.displayName.trim().length > 0
        ? w.displayName.trim()
        : typeof w.name === "string" && w.name.trim().length > 0
          ? w.name.trim()
          : "Workspace";
    const projects: ScopeSwitcherWorkspaceOption["projects"][number][] = [];
    const prows = w.projects;
    if (Array.isArray(prows)) {
      for (const p of prows) {
        if (p === null || typeof p !== "object") {
          continue;
        }
        const pid = (p as { projectId?: string; id?: string }).projectId ?? (p as { id?: string }).id;
        if (typeof pid !== "string" || pid.trim().length === 0) {
          continue;
        }
        const pname =
          typeof p.displayName === "string" && p.displayName.trim().length > 0
            ? p.displayName.trim()
            : typeof p.name === "string" && p.name.trim().length > 0
              ? p.name.trim()
              : "Project";
        projects.push({ projectId: pid.trim(), name: pname });
      }
    }
    out.push({ workspaceId: wid.trim(), name: wname, projects });
  }
  return out;
}

export function demoClaimsIntakeWorkspaceOption(): ScopeSwitcherWorkspaceOption {
  return {
    workspaceId: DEV_SCOPE_WORKSPACE_ID,
    name: BUYER_WORKSPACE_DISPLAY_NAME,
    projects: [{ projectId: DEV_SCOPE_PROJECT_ID, name: "Primary project" }],
  };
}

export function shouldUseSampleWorkspaceFallback(
  workspaceId: string,
  projectId: string,
): boolean {
  return isEffectiveDevDefaultScope(workspaceId, projectId);
}
