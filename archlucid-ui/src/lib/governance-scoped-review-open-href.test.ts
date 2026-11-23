import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { resolveGovernanceScopedReviewOpenHref } from "@/lib/governance-scoped-review-open-href";

const deskFixture = vi.hoisted(() => ({ id: null as string | null }));

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: () => deskFixture.id,
}));

describe("resolveGovernanceScopedReviewOpenHref", () => {
  beforeEach(() => {
    deskFixture.id = null;
  });
  it("opens nested review when architecture id is on the schedule", () => {
    expect(
      resolveGovernanceScopedReviewOpenHref({
        runId: "run-nested",
        architectureId: "architecture-desk-001",
      }),
    ).toBe("/architecture/architectures/architecture-desk-001/reviews/run-nested");
  });

  it("uses desk cache when locator has no architecture parent", () => {
    deskFixture.id = "architecture-cached-002";

    expect(
      resolveGovernanceScopedReviewOpenHref({
        runId: "run-peer",
        requestId: null,
      }),
    ).toBe("/architecture/architectures/architecture-cached-002/reviews/run-peer");
  });

  it("passes draft registry entries through the working locator", () => {
    const entry: ArchitectureDraftRegistryEntry = {
      draftId: "draft-1",
      displayName: "Draft",
      customerStatus: "review-linked",
      ownerLabel: "You",
      lastUpdatedUtc: "2026-01-01T00:00:00.000Z",
      linkedReviewId: "run-registry",
      serverUpdatedUtc: "2026-01-01T00:00:00.000Z",
      parentArchitectureId: "architecture-from-registry",
    };

    expect(
      resolveGovernanceScopedReviewOpenHref({
        runId: "run-registry",
        architectureId: null,
        draftRegistryEntries: [entry],
      }),
    ).toBe("/architecture/architectures/architecture-from-registry/reviews/run-registry");
  });
});
