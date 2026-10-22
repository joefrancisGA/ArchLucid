import { describe, expect, it } from "vitest";

import {
  findTenantWorkspaceRow,
  isWorkspaceDefaultProject,
  parseTenantWorkspacesListPayload,
} from "@/lib/tenant-workspaces-list-payload";

describe("tenant-workspaces-list-payload", () => {
  it("parses nested workspaces and defaultProjectId", () => {
    const parsed = parseTenantWorkspacesListPayload({
      retentionDays: 45,
      workspaces: [
        {
          workspaceId: "ws-1",
          name: "Production",
          defaultProjectId: "proj-default",
          projects: [{ projectId: "proj-default", name: "Core" }, { projectId: "proj-2", name: "Edge" }],
        },
      ],
    });

    expect(parsed.workspaces).toHaveLength(1);
    expect(parsed.workspaces[0]?.defaultProjectId).toBe("proj-default");
    expect(parsed.workspaces[0]?.projects).toHaveLength(2);
    expect(parsed.retentionDays).toBe(45);
    expect(findTenantWorkspaceRow(parsed, "ws-1")?.name).toBe("Production");
    expect(isWorkspaceDefaultProject(parsed.workspaces[0]!, "proj-default")).toBe(true);
    expect(isWorkspaceDefaultProject(parsed.workspaces[0]!, "proj-2")).toBe(false);
  });
});
