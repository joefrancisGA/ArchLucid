import { describe, expect, it } from "vitest";

import {
  addArchivedReviewToClientCache,
  archivedReviewsClientCacheKey,
  listArchivedReviewsClientCache,
  writeArchivedReviewsClientCache,
} from "@/lib/archived-reviews-client-cache";
import type { RunSummary } from "@/types/authority";

const scope = { tenantId: "tenant-a", workspaceId: "workspace-a", projectId: "project-a" };
const cacheKey = archivedReviewsClientCacheKey(scope);

describe("archived-reviews-client-cache", () => {
  it("stores archived runs with isArchived true", () => {
    window.localStorage.clear();

    const run = {
      runId: "run-archived",
      projectId: "default",
      createdUtc: "2026-08-01T12:00:00.000Z",
    } satisfies RunSummary;

    addArchivedReviewToClientCache(run, cacheKey);

    const cached = listArchivedReviewsClientCache(cacheKey);

    expect(cached).toHaveLength(1);
    expect(cached[0]?.runId).toBe("run-archived");
    expect(cached[0]?.isArchived).toBe(true);
  });

  it("dedupes by run id and keeps newest archive first", () => {
    window.localStorage.clear();

    writeArchivedReviewsClientCache([
      {
        runId: "run-a",
        projectId: "default",
        createdUtc: "2026-08-01T12:00:00.000Z",
        isArchived: true,
      } satisfies RunSummary,
    ], cacheKey);

    addArchivedReviewToClientCache({
      runId: "run-a",
      projectId: "default",
      description: "Updated title",
      createdUtc: "2026-08-02T12:00:00.000Z",
    }, cacheKey);

    const cached = listArchivedReviewsClientCache(cacheKey);

    expect(cached).toHaveLength(1);
    expect(cached[0]?.description).toBe("Updated title");
  });

  it("keeps each tenant, workspace, and project in its own cache", () => {
    window.localStorage.clear();
    const run = {
      runId: "scoped-review",
      projectId: "default",
      createdUtc: "2026-08-01T12:00:00.000Z",
    } satisfies RunSummary;

    addArchivedReviewToClientCache(run, cacheKey);

    expect(listArchivedReviewsClientCache(cacheKey)).toMatchObject([{ runId: run.runId }]);
    for (const otherScope of [
      { ...scope, tenantId: "tenant-b" },
      { ...scope, workspaceId: "workspace-b" },
      { ...scope, projectId: "project-b" },
      { ...scope, projectId: "" },
    ]) {
      expect(listArchivedReviewsClientCache(archivedReviewsClientCacheKey(otherScope))).toEqual([]);
    }
  });

  it("discards legacy entries that do not have a known scope", () => {
    window.localStorage.clear();
    const legacyKey = "archlucid.archivedReviewsClientCache.v1";
    window.localStorage.setItem(legacyKey, JSON.stringify([
      { runId: "legacy-review", projectId: "default", createdUtc: "2026-08-01T12:00:00.000Z" },
    ]));

    expect(listArchivedReviewsClientCache(cacheKey)).toEqual([]);
    expect(window.localStorage.getItem(legacyKey)).toBeNull();
  });
});
