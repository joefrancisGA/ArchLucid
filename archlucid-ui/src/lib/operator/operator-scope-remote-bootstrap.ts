import { fetchPostAuthBootstrapStatus } from "@/lib/auth/post-auth-bootstrap-api";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";
import {
  isSampleWorkspaceScope,
} from "@/lib/operator/operator-workspace-scope-model";
import { fetchTenantWorkspacesList } from "@/lib/tenant-workspaces-list-client";

function resolveProjectIdForWorkspace(
  defaultProjectId: string | null,
  projects: ReadonlyArray<{ readonly projectId: string }>,
): string {
  if (defaultProjectId !== null && defaultProjectId.trim().length > 0) {
    return defaultProjectId.trim();
  }

  const firstProject = projects[0];

  if (firstProject === undefined) {
    return "";
  }

  return firstProject.projectId.trim();
}

/** Signed-in bootstrap: workspace directory + post-auth status (BFF session; no browser JWT). */
export async function resolveDedicatedScopeFromRemoteBootstrap(): Promise<OperatorScopeRecord | null> {
  try {
    const status = await fetchPostAuthBootstrapStatus();
    const workspace = status.workspaces[0];

    if (workspace === undefined) {
      return null;
    }

    const tenantId = workspace.tenantId.trim();
    const workspaceId = workspace.workspaceId.trim();

    if (tenantId.length === 0 || workspaceId.length === 0) {
      return null;
    }

    const list = await fetchTenantWorkspacesList();
    const match = list.workspaces.find((row) => row.workspaceId === workspaceId);
    const projectId =
      match === undefined
        ? ""
        : resolveProjectIdForWorkspace(match.defaultProjectId, match.projects);

    const record: OperatorScopeRecord = {
      tenantId,
      workspaceId,
      projectId,
      workspaceLabel: workspace.workspaceName.trim(),
      projectLabel: projectId.length > 0 ? "Primary project" : "",
    };

    if (isSampleWorkspaceScope(record) || record.projectId.trim().length === 0) {
      return null;
    }

    return record;
  } catch {
    return null;
  }
}
