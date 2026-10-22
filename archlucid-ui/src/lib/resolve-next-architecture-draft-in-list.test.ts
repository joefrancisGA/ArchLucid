import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { resolveNextArchitectureDraftInList } from "@/lib/resolve-next-architecture-draft-in-list";

function entry(overrides: Partial<ArchitectureDraftRegistryEntry> = {}): ArchitectureDraftRegistryEntry {
  return {
    draftId: "draft-1",
    displayName: "Claims intake",
    customerStatus: "draft",
    ownerLabel: "You",
    lastUpdatedUtc: "2026-01-01T00:00:00Z",
    linkedReviewId: null,
    serverUpdatedUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("resolveNextArchitectureDraftInList", () => {
  it("returns the next draft in recency order", () => {
    const next = resolveNextArchitectureDraftInList(
      [
        entry({ draftId: "draft-new", lastUpdatedUtc: "2026-02-01T00:00:00Z", displayName: "New draft" }),
        entry({ draftId: "draft-old", lastUpdatedUtc: "2025-01-01T00:00:00Z", displayName: "Old draft" }),
      ],
      "draft-new",
    );

    expect(next?.draftId).toBe("draft-old");
    expect(next?.href).toBe("/architecture/architectures/draft-old");
  });
});
