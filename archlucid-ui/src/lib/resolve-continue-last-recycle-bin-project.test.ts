import { describe, expect, it } from "vitest";

import {
  flattenRecycleBinProjects,
  RECYCLE_BIN_PROJECT_LAST_VIEWED_STORAGE_KEY,
  resolveContinueLastRecycleBinProject,
} from "@/lib/resolve-continue-last-recycle-bin-project";

describe("resolveContinueLastRecycleBinProject", () => {
  it("returns null when input is not an array", () => {
    expect(resolveContinueLastRecycleBinProject(null)).toBeNull();
    expect(resolveContinueLastRecycleBinProject({})).toBeNull();
    expect(resolveContinueLastRecycleBinProject("nope")).toBeNull();
    expect(resolveContinueLastRecycleBinProject([])).toBeNull();
  });

  it("returns the stored project when it still exists", () => {
    window.localStorage.setItem(RECYCLE_BIN_PROJECT_LAST_VIEWED_STORAGE_KEY, "proj-2");

    const match = resolveContinueLastRecycleBinProject(
      flattenRecycleBinProjects([
        {
          workspaceId: "ws-1",
          name: "Production",
          deletedProjects: [
            {
              projectId: "proj-1",
              name: "Older",
              deletedUtcIso: "2026-07-01T00:00:00.000Z",
              purgeAfterUtcIso: "2026-07-31T00:00:00.000Z",
            },
            {
              projectId: "proj-2",
              name: "Pinned",
              deletedUtcIso: "2026-06-01T00:00:00.000Z",
              purgeAfterUtcIso: "2026-06-30T00:00:00.000Z",
            },
          ],
        },
      ]),
    );

    expect(match?.projectId).toBe("proj-2");
    expect(match?.projectName).toBe("Pinned");
  });

  it("falls back to the most recently deleted project", () => {
    window.localStorage.removeItem(RECYCLE_BIN_PROJECT_LAST_VIEWED_STORAGE_KEY);

    const match = resolveContinueLastRecycleBinProject(
      flattenRecycleBinProjects([
        {
          workspaceId: "ws-1",
          name: "Production",
          deletedProjects: [
            {
              projectId: "older",
              name: "Older",
              deletedUtcIso: "2026-01-01T00:00:00.000Z",
              purgeAfterUtcIso: "2026-01-31T00:00:00.000Z",
            },
          ],
        },
        {
          workspaceId: "ws-2",
          name: "Sandbox",
          deletedProjects: [
            {
              projectId: "newer",
              name: "Newer",
              deletedUtcIso: "2026-08-01T00:00:00.000Z",
              purgeAfterUtcIso: "2026-08-31T00:00:00.000Z",
            },
          ],
        },
      ]),
    );

    expect(match?.projectId).toBe("newer");
    expect(match?.workspaceName).toBe("Sandbox");
  });

  it("uses the latest valid deletion instant when no project was viewed", () => {
    window.localStorage.removeItem(RECYCLE_BIN_PROJECT_LAST_VIEWED_STORAGE_KEY);
    const projects = [
      { projectId: "older", deletedUtcIso: "2026-08-01T12:30:00+02:00" },
      { projectId: "newer", deletedUtcIso: "2026-08-01T11:00:00Z" },
      { projectId: "unreadable", deletedUtcIso: "unknown" },
    ].map((project) => ({
      ...project,
      projectName: project.projectId,
      workspaceId: "ws-1",
      workspaceName: "Production",
      purgeAfterUtcIso: "2026-08-31T00:00:00Z",
    }));

    expect(resolveContinueLastRecycleBinProject(projects)?.projectId).toBe("newer");
  });

  it("does not substitute another project after the last-viewed project is restored", () => {
    window.localStorage.setItem(RECYCLE_BIN_PROJECT_LAST_VIEWED_STORAGE_KEY, "restored-project");

    expect(resolveContinueLastRecycleBinProject([
      {
        projectId: "still-deleted-project",
        projectName: "Still deleted",
        workspaceId: "ws-1",
        workspaceName: "Production",
        deletedUtcIso: "2026-08-01T11:00:00Z",
        purgeAfterUtcIso: "2026-08-31T00:00:00Z",
      },
    ])).toBeNull();
  });
});
