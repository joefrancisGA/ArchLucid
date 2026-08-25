import { describe, expect, it } from "vitest";

import {
  flattenRecycleBinProjects,
  RECYCLE_BIN_PROJECT_LAST_VIEWED_STORAGE_KEY,
  resolveContinueLastRecycleBinProject,
} from "@/lib/resolve-continue-last-recycle-bin-project";

describe("resolveContinueLastRecycleBinProject", () => {
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
});
