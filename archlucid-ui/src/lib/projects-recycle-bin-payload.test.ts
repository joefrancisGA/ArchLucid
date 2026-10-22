import { describe, expect, it } from "vitest";

import {
  coerceRecycleBinPayload,
  recycleBinEmptyStateBody,
  recycleBinPageDescription,
} from "./projects-recycle-bin-payload";

describe("projects-recycle-bin-payload", () => {
  it("states the concrete retention window in page copy when the API returns retentionDays", () => {
    expect(recycleBinPageDescription(30)).toContain("30 days");
    expect(recycleBinPageDescription(30)).not.toContain("retention period");
    expect(recycleBinEmptyStateBody(30)).toContain("30-day");
    expect(recycleBinEmptyStateBody(30)).not.toContain("retention period");
  });

  it("uses honest copy when retentionDays is unknown", () => {
    expect(recycleBinPageDescription(null)).not.toContain("30 days");
    expect(recycleBinPageDescription(null)).toContain("tenant retention window");
    expect(recycleBinEmptyStateBody(null)).not.toContain("30-day");
    expect(recycleBinEmptyStateBody(null)).toContain("retention window");
  });

  it("does not fabricate a default retention window when the payload omits retentionDays", () => {
    const parsed = coerceRecycleBinPayload({ workspaces: [] });

    expect(parsed.retentionDays).toBeNull();
  });

  it("parses retentionDays and purgeAfterUtc from recycle-bin payload", () => {
    const parsed = coerceRecycleBinPayload({
      retentionDays: 45,
      workspaces: [
        {
          workspaceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          name: "Primary",
          deletedProjects: [
            {
              projectId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              name: "Pilot",
              deletedUtc: "2026-08-01T12:00:00.000Z",
              purgeAfterUtc: "2026-09-15T12:00:00.000Z",
            },
          ],
        },
      ],
    });

    expect(parsed.retentionDays).toBe(45);
    expect(parsed.workspaces).toHaveLength(1);
    expect(parsed.workspaces[0]?.deletedProjects[0]?.purgeAfterUtcIso).toBe("2026-09-15T12:00:00.000Z");
  });

  it("derives purgeAfterUtc when the API omits it", () => {
    const parsed = coerceRecycleBinPayload({
      retentionDays: 30,
      workspaces: [
        {
          workspaceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          name: "Primary",
          deletedProjects: [
            {
              projectId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              name: "Pilot",
              deletedUtc: "2026-08-01T12:00:00.000Z",
            },
          ],
        },
      ],
    });

    expect(parsed.workspaces).toHaveLength(1);
    expect(parsed.workspaces[0]?.deletedProjects[0]?.purgeAfterUtcIso).toBe("2026-08-31T12:00:00.000Z");
  });
});
