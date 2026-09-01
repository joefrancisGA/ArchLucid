import { describe, expect, it } from "vitest";

import { mapDraftSummaryToRegistryEntry } from "@/lib/architecture/architecture-draft-summary-mapper";
import type { DraftRequestSummary } from "@/types/draft-intake";

describe("mapDraftSummaryToRegistryEntry", () => {
  it("maps spawned drafts to review-linked registry rows", () => {
    const summary: DraftRequestSummary = {
      draftId: "11111111-1111-1111-1111-111111111111",
      status: "RunSpawned",
      systemName: "Claims intake",
      freeTextIntent: "Modernize claims intake with governed evidence.",
      spawnedRunId: "run-claims",
      createdByUserId: "user-1",
      createdUtc: "2026-08-27T12:00:00.000Z",
      updatedUtc: "2026-08-27T12:30:00.000Z",
      reviewReadinessValid: true,
    };

    const entry = mapDraftSummaryToRegistryEntry(summary);

    expect(entry.architectureId).toBe(summary.draftId);
    expect(entry.displayName).toBe("Claims intake");
    expect(entry.customerStatus).toBe("review-linked");
    expect(entry.linkedReviewId).toBe("run-claims");
  });
});
