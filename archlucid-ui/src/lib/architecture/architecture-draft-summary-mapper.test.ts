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

    expect(entry.draftId).toBe(summary.draftId);
    expect(entry.displayName).toBe("Claims intake");
    expect(entry.customerStatus).toBe("review-linked");
    expect(entry.linkedReviewId).toBe("run-claims");
  });

  it("keeps the summary-derived ready-for-review status when the partial document fails readiness", () => {
    const summary: DraftRequestSummary = {
      draftId: "22222222-2222-2222-2222-222222222222",
      status: "Drafting",
      systemName: "Billing modernization",
      freeTextIntent: "Short intent.",
      spawnedRunId: null,
      createdByUserId: "user-1",
      createdUtc: "2026-08-27T12:00:00.000Z",
      updatedUtc: "2026-08-27T12:30:00.000Z",
      reviewReadinessValid: true,
    };

    const entry = mapDraftSummaryToRegistryEntry(summary);

    expect(entry.customerStatus).toBe("ready-for-review");
  });

  it.each(["Admitted", "Submitted"] as const)(
    "treats %s summaries as ready-for-review like the registry special case",
    (status) => {
      const summary: DraftRequestSummary = {
        draftId: "33333333-3333-3333-3333-333333333333",
        status,
        systemName: "Payments platform",
        freeTextIntent: "Short intent.",
        spawnedRunId: null,
        createdByUserId: "user-1",
        createdUtc: "2026-08-27T12:00:00.000Z",
        updatedUtc: "2026-08-27T12:30:00.000Z",
        reviewReadinessValid: false,
      };

      const entry = mapDraftSummaryToRegistryEntry(summary);

      expect(entry.customerStatus).toBe("ready-for-review");
    },
  );
});
