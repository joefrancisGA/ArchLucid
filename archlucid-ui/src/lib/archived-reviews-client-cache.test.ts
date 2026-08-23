import { describe, expect, it } from "vitest";

import {
  addArchivedReviewToClientCache,
  listArchivedReviewsClientCache,
  writeArchivedReviewsClientCache,
} from "@/lib/archived-reviews-client-cache";
import type { RunSummary } from "@/types/authority";

describe("archived-reviews-client-cache", () => {
  it("stores archived runs with isArchived true", () => {
    window.localStorage.clear();

    const run = {
      runId: "run-archived",
      projectId: "default",
      createdUtc: "2026-08-01T12:00:00.000Z",
    } satisfies RunSummary;

    addArchivedReviewToClientCache(run);

    const cached = listArchivedReviewsClientCache();

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
    ]);

    addArchivedReviewToClientCache({
      runId: "run-a",
      projectId: "default",
      description: "Updated title",
      createdUtc: "2026-08-02T12:00:00.000Z",
    });

    const cached = listArchivedReviewsClientCache();

    expect(cached).toHaveLength(1);
    expect(cached[0]?.description).toBe("Updated title");
  });
});
