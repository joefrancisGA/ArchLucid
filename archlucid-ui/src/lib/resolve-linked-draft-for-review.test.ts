import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

import { resolveLinkedDraftForReview } from "./resolve-linked-draft-for-review";

function makeDraft(
  overrides: Partial<ArchitectureDraftRegistryEntry> & Pick<ArchitectureDraftRegistryEntry, "architectureId">,
): ArchitectureDraftRegistryEntry {
  return {
    architectureId: overrides.architectureId,
    displayName: overrides.displayName ?? "Payments draft",
    customerStatus: overrides.customerStatus ?? "drafting",
    ownerLabel: overrides.ownerLabel ?? "You",
    lastUpdatedUtc: overrides.lastUpdatedUtc ?? "2026-01-01T00:00:00.000Z",
    linkedReviewId: overrides.linkedReviewId ?? null,
    serverUpdatedUtc: overrides.serverUpdatedUtc ?? "2026-01-01T00:00:00.000Z",
  };
}

describe("resolveLinkedDraftForReview (LS-06)", () => {
  it("returns the draft linked to the review run id", () => {
    const drafts = [
      makeDraft({ architectureId: "draft-a", linkedReviewId: "run-other" }),
      makeDraft({ architectureId: "draft-b", linkedReviewId: "run-base" }),
    ];

    expect(resolveLinkedDraftForReview("run-base", drafts)?.architectureId).toBe("draft-b");
  });

  it("returns null when no draft is linked", () => {
    expect(resolveLinkedDraftForReview("run-missing", [])).toBeNull();
  });
});
