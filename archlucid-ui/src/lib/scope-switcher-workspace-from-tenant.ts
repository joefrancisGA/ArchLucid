import type { TenantWorkspaceListRow } from "@/lib/tenant-workspaces-list-payload";
import type { ScopeSwitcherWorkspaceOption } from "@/lib/scope-switcher-display";

export function mapTenantWorkspaceToScopeSwitcherOption(
  row: TenantWorkspaceListRow,
): ScopeSwitcherWorkspaceOption {
  return {
    workspaceId: row.workspaceId,
    name: row.name,
    projects: row.projects.map((project) => ({
      projectId: project.projectId,
      name: project.name,
    })),
  };
}
