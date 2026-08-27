import { beforeEach, describe, expect, it } from "vitest";

import {
  listArchitectureDraftRegistryEntries,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { syncArchitectureDraftRegistryForFinalizedReview } from "@/lib/architecture/architecture-draft-registry-finalize-sync";

describe("syncArchitectureDraftRegistryForFinalizedReview", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("updates linked draft rows to review-linked status", () => {
    upsertArchitectureDraftRegistryEntry({
      architectureId: "arch-vertex",
      displayName: "Vertex",
      customerStatus: "ready-for-review",
      ownerLabel: "You",
      lastUpdatedUtc: "2026-08-27T12:00:00.000Z",
      linkedReviewId: "run-vertex",
      serverUpdatedUtc: "2026-08-27T12:00:00.000Z",
      serverDraftStatus: "RunSpawned",
    });

    syncArchitectureDraftRegistryForFinalizedReview("run-vertex");

    const [entry] = listArchitectureDraftRegistryEntries();

    expect(entry?.customerStatus).toBe("review-linked");
    expect(entry?.linkedReviewId).toBe("run-vertex");
  });
});
